// 이미지 업로드/조회 API - Swagger 명세 준수
import { api } from './apiClient';

/**
 * 사용자 이미지 타입
 * PROFILE: 프로필 사진
 * BANNER: 배너 사진
 */
export type UserImageType = 'PROFILE' | 'BANNER';

/**
 * 업로드 URL 응답
 * uploadUrl: Presigned URL (Cloudflare R2 업로드용) 또는 CDN URL (조회용)
 */
export interface UploadUrlResponse {
  uploadUrl: string;
}

/**
 * GET /api/image/upload-url
 * Cloudflare R2에 직접 업로드할 수 있는 Presigned URL 발급 (3분 유효)
 * 백엔드 반환값: SuccessResponse<UploadUrlResponse>
 * @param type PROFILE | BANNER
 * @param contentType 파일의 MIME 타입 (예: image/jpeg, image/png)
 * @returns Promise<{ uploadUrl: string; contentType: string }> - 클라이언트가 받는 데이터
 */
export const getUploadUrl = async (
  type: UserImageType,
  contentType: string
): Promise<{ uploadUrl: string; contentType: string }> => {
  const res = await api(
    `/image/upload-url?type=${type}&contentType=${encodeURIComponent(contentType)}`,
    { method: 'GET' }
  );
  
  console.log('[ImageService] getUploadUrl response:', { type, res });
  
  const uploadUrl = res.upload_url || res.data?.upload_url || res.data?.uploadUrl || res.uploadUrl;
  
  if (!uploadUrl) {
    console.error('[ImageService] Failed to extract upload URL from response:', res);
    throw new Error(`업로드 URL을 받지 못했습니다. 응답: ${JSON.stringify(res)}`);
  }
  
  console.log('[ImageService] Upload URL extracted:', uploadUrl);
  return { uploadUrl, contentType };
};

/**
 * POST /api/image/upload-complete
 * 클라이언트가 Cloudflare R2에 파일 업로드 후 서버에 완료 통보 (DB에 저장)
 * @param type PROFILE | BANNER
 * @returns 이미지 URL이 포함된 응답
 */
export const completeUpload = async (type: UserImageType): Promise<string> => {
  const res = await api(`/image/upload-complete?type=${type}`, {
    method: 'POST',
  });
  console.log('[ImageService] completeUpload response:', { type, res });
  
  // 응답에서 이미지 URL 추출
  const imageUrl = res.data?.url || res.data?.image_url || res.url || res.image_url;
  
  if (!imageUrl) {
    console.error('[ImageService] Failed to extract image URL from completeUpload response:', res);
    throw new Error(`이미지 URL을 받지 못했습니다. 응답: ${JSON.stringify(res)}`);
  }
  
  return imageUrl;
};

/**
 * GET /api/image/image-url
 * 사용자가 업로드한 이미지의 CDN URL 조회 (없을 시 기본 이미지 반환)
 * @param type PROFILE | BANNER
 * @returns SuccessResponse<UploadUrlResponse>
 */
export const getImageUrl = async (type: UserImageType): Promise<string> => {
  const res = await api(`/image/image-url?type=${type}`, { method: 'GET' });
  
  console.log('[ImageService] getImageUrl full response:', res);
  
  const imageUrl = res.upload_url || res.data?.upload_url || res.imageUrl || res.data?.imageUrl;
  
  if (!imageUrl) {
    console.error('[ImageService] Failed to extract image URL from response:', res);
    throw new Error(`이미지 URL을 받지 못했습니다. 응답: ${JSON.stringify(res)}`);
  }
  
  console.log('[ImageService] Raw image URL:', imageUrl);
  
  // URL이 상대 경로인 경우 API 기반 URL과 결합
  const finalUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${import.meta.env.VITE_API_BASE_URL}/${imageUrl}`;
  
  console.log('[ImageService] Final image URL:', finalUrl);
  return finalUrl;
};
