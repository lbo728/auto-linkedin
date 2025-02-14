import {getLinkedInPostData, appendToSheet} from "./index.js";

async function testFunction() {
  console.log("테스트 시작");
  const url =
    "https://www.linkedin.com/posts/byungwoo-lee-98a253200_%EC%9D%B4%EC%8A%88%EB%9D%BC-%ED%95%98%EA%B8%B0-%EC%A0%84%EC%97%90-%ED%95%9C%EB%B2%88-%EB%8D%94-%EB%8F%8C%EC%95%84%EB%B3%B4%EC%9E%90-%EC%B5%9C%EA%B7%BC-%EC%A7%84%ED%96%89-%EC%A4%91%EC%9D%B8-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%EB%8A%94-%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4%EC%97%90-activity-7295372023109668865-Zy7y?utm_source=share&utm_medium=member_desktop";
  try {
    const scrapedData = await getLinkedInPostData(url);
    console.log("🔥 크롤링 성공:", scrapedData);

    await appendToSheet({...scrapedData, url});
    console.log("✅ 스프레드시트 업데이트 완료!");
  } catch (error) {
    console.error("🚨 테스트 실패:", error);
  }
}

testFunction();
