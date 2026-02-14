import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

/**
 * manifest.json 생성 함수
 * - 항상 현재 실제 존재하는 파일들만 리스트업
 * - public/news 폴더에서만 읽음 (모든 환경에서 동일)
 */
function generateManifest() {
  const newsDir = path.join(process.cwd(), 'public', 'news');

  try {
    // 폴더가 존재하지 않으면 생성
    if (!fs.existsSync(newsDir)) {
      fs.mkdirSync(newsDir, { recursive: true });
    }

    // .md 파일 목록 수집 (실제 존재하는 파일만)
    const files = fs
      .readdirSync(newsDir)
      .filter((file) => {
        const fullPath = path.join(newsDir, file);
        const isFile = fs.statSync(fullPath).isFile();
        return isFile && file.endsWith('.md');
      })
      .sort(); // 파일명 순서대로 정렬

    // manifest.json 생성
    const manifest = {
      files,
      updated: new Date().toISOString(),
    };

    // public/news 폴더에 manifest.json 저장 (개발 서버용)
    fs.writeFileSync(
      path.join(newsDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    return manifest;
  } catch (error) {
    return { files: [], updated: new Date().toISOString() };
  }
}

export function newsManifestPlugin(): Plugin {
  return {
    name: 'news-manifest-plugin',
    
    // 개발 서버 시작 시 실행
    configResolved() {
      generateManifest();
    },
    
    // 개발 중 파일 감시 (모든 변경 감지: 생성, 수정, 삭제)
    async handleHotUpdate({ file, server }) {
      if (file.includes('public/news') && file.endsWith('.md')) {
        generateManifest();
        
        // 클라이언트에 업데이트 알림
        server.ws.send({
          type: 'custom',
          event: 'news-updated',
          data: { timestamp: new Date().toISOString() }
        });
      }
    },
    
    // 빌드 시 manifest.json 생성
    generateBundle() {
      generateManifest();
      
      // manifest.json은 public/news에 있으므로 자동으로 dist로 복사됨
      // public 폴더의 모든 파일이 dist로 복사되는 것이 Vite의 기본 동작
    },
  };
}
