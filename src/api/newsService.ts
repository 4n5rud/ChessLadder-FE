/**
 * 뉴스 서비스 - 마크다운 파일을 로드하고 파싱합니다
 */

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  date: string;
}

/**
 * 마크다운 파일의 front matter에서 날짜 추출 (파싱 없이 그대로 반환)
 * 형식:
 * ---
 * date: 2026-02-13
 * ---
 */
const extractDate = (content: string): string => {
  // YAML front matter 추출 (--로 둘러싸인 부분)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    // date: 이후의 모든 문자 추출 (그대로 반환)
    const dateMatch = frontmatter.match(/date:\s*(.+?)(?:\n|$)/);
    if (dateMatch && dateMatch[1]) {
      return dateMatch[1].trim();
    }
  }
  
  // front matter가 없으면 공백 반환
  return '';
};

/**
 * 마크다운 헤더에서 제목 추출
 * 마크다운 첫 줄의 # 제목을 제목으로 사용
 * 예: "# ChessLadder 프로젝트 임시 배포!" -> "ChessLadder 프로젝트 임시 배포!"
 */
const extractTitle = (content: string): string => {
  // YAML front matter 제거
  const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  // 마크다운 헤더(# 제목) 추출
  const headerMatch = contentWithoutFrontmatter.match(/^#\s+(.+)$/m);
  if (headerMatch && headerMatch[1]) {
    return headerMatch[1].trim();
  }
  
  // 헤더가 없으면 첫 줄 사용
  const firstLine = contentWithoutFrontmatter.split('\n')[0].trim();
  return firstLine || '제목 없음';
};

/**
 * 마크다운 파일의 전체 내용을 본문으로 사용 (front matter 제외)
 */
const extractBody = (content: string): string => {
  // YAML front matter 제거
  const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  return contentWithoutFrontmatter.trim();
};



/**
 * 모든 뉴스 항목을 로드합니다
 */
export const loadAllNews = async (): Promise<NewsItem[]> => {
  try {
    // public/news 폴더의 manifest.json에서 파일 목록 로드
    const response = await fetch('/news/manifest.json');
    
    if (response.ok) {
      const manifest = await response.json();
      const newsItems: NewsItem[] = [];

      for (const filename of manifest.files) {
        try {
          const newsResponse = await fetch(`/news/${filename}`);
          if (newsResponse.ok) {
            const content = await newsResponse.text();
            const title = extractTitle(content);
            const body = extractBody(content);
            const date = extractDate(content);

            newsItems.push({
              id: filename.replace(/\.md$/, ''),
              title,
              body,
              date,
            });
          }
        } catch (err) {
          // Failed to load news file
        }
      }

      // 파일명의 앞 번호를 기준으로 내림차순 정렬 (숫자가 클수록 최신)
      return newsItems.sort((a, b) => {
        const numA = parseInt(a.id.match(/^\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.id.match(/^\d+/)?.[0] || '0', 10);
        return numB - numA;
      });
    } else {
      throw new Error('manifest.json not found');
    }
  } catch (err) {
    return [];
  }
};

/**
 * 특정 뉴스 항목 로드
 */
export const loadNewsByID = async (id: string): Promise<NewsItem | null> => {
  try {
    const response = await fetch(`/news/${id}.md`);
    if (response.ok) {
      const content = await response.text();
      const title = extractTitle(content);
      const body = extractBody(content);
      const date = extractDate(content);

      return {
        id,
        title,
        body,
        date,
      };
    }
  } catch (err) {
    // Failed to load news
  }

  return null;
};
