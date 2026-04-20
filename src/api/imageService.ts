// 이미지 업로드/조회 API - Swagger 명세 준수
import { api } from './apiClient';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateImageFile = (file: File): { message: string } | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { message: '지원하지 않는 파일 형식입니다. JPG, PNG, WEBP, GIF만 가능합니다.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { message: '파일 크기는 10MB 이하여야 합니다.' };
  }
  return null;
};

export const validateImageDimensions = (file: File): Promise<{ message: string } | null> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 100 || img.height < 100) {
        resolve({ message: '이미지 해상도가 너무 낮습니다. 최소 100x100px 이상이어야 합니다.' });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ message: '이미지를 읽을 수 없습니다.' });
    };
    img.src = url;
  });
};

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
  
  const uploadUrl = res.upload_url || res.data?.upload_url || res.data?.uploadUrl || res.uploadUrl;
  
  if (!uploadUrl) {
    throw new Error('Upload URL fetch failed');
  }
  return { uploadUrl, contentType };
};

/**
 * POST /api/image/upload-complete
 * 클라이언트가 Cloudflare R2에 파일 업로드 후 서버에 완료 통보 (DB에 저장)
 * @param type PROFILE | BANNER
 * @returns 이미지 URL (없으면 null 허용)
 */
export const completeUpload = async (type: UserImageType): Promise<void> => {
  const res = await api(`/image/upload-complete?type=${type}`, {
    method: 'POST',
  });
  
  // 백엔드에서 data: null을 반환하는 경우도 성공으로 처리
  // (이미지는 getUserProfile()에서 다시 조회하므로 OK)
  if (!res.success) {
    throw new Error('Upload complete failed');
  }
};

/**
 * GET /api/image/image-url
 * 사용자가 업로드한 이미지의 CDN URL 조회 (없을 시 기본 이미지 반환)
 * @param type PROFILE | BANNER
 * @returns SuccessResponse<UploadUrlResponse>
 */
export const getImageUrl = async (type: UserImageType): Promise<string> => {
  const res = await api(`/image/image-url?type=${type}`, { method: 'GET' });
  
  const imageUrl = res.upload_url || res.data?.upload_url || res.imageUrl || res.data?.imageUrl;
  
  if (!imageUrl) {
    throw new Error('Image URL fetch failed');
  }
  
  // URL이 상대 경로인 경우 API 기반 URL과 결합
  const finalUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${import.meta.env.VITE_API_BASE_URL}/${imageUrl}`;
  
  return finalUrl;
};
