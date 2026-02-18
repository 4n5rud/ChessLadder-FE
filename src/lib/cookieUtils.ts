/**
 * 쿠키 유틸리티 함수
 * accessToken, refreshToken 관리를 위한 쿠키 읽기, 삭제 함수 모음
 */

/**
 * 쿠키 이름으로 값을 읽습니다
 * @param name 쿠키 이름 (예: 'access', 'refresh')
 * @returns 쿠키 값 또는 null
 */
export function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}

/**
 * 쿠키를 삭제합니다 (Max-Age를 0으로 설정)
 * @param name 쿠키 이름
 */
export function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * 쿠키에서 토큰을 추출하고 즉시 쿠키를 삭제합니다
 * accessToken 처리 시 사용: 쿠키 읽기 → 메모리 저장 → 쿠키 삭제
 * @param name 쿠키 이름
 * @returns 추출된 토큰 또는 null
 */
export function extractTokenFromCookie(name: string): string | null {
  const token = getCookie(name);
  if (token) {
    deleteCookie(name);
    return token;
  }
  return null;
}
