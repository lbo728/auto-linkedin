import * as functions from "firebase-functions";
import admin from "firebase-admin";
import puppeteer from "puppeteer";
import {google} from "googleapis";
import * as dotenv from "dotenv";

dotenv.config();

interface PostData {
  title: string;
  viewCount: string;
  likeCount: string;
  shareCount: string;
}

// Firebase Admin 초기화
const app = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore(app);

const SHEET_ID = process.env.SHEET_ID;
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

console.log(SHEET_ID);

const auth = new google.auth.JWT(CLIENT_EMAIL, undefined, PRIVATE_KEY, [
  "https://www.googleapis.com/auth/spreadsheets",
]);

const sheets = google.sheets({version: "v4", auth});

/**
 * LinkedIn 게시물 데이터를 크롤링하는 함수
 */
export async function getLinkedInPostData(url: string): Promise<PostData> {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.goto(url, {waitUntil: "networkidle2"});

  const title = await page.$eval("h2", (el: Element) =>
    (el as HTMLElement).innerText.trim()
  );
  const viewCount = await page.$eval(
    ".social-details-social-counts__reactions-count",
    (el: Element) => (el as HTMLElement).innerText.trim()
  );
  const likeCount = await page.$eval(
    ".social-details-social-counts__social-proof",
    (el: Element) => (el as HTMLElement).innerText.trim()
  );
  const shareCount = await page.$eval(
    ".social-details-social-counts__reshare-count",
    (el: Element) => (el as HTMLElement).innerText.trim()
  );

  await browser.close();

  return {title, viewCount, likeCount, shareCount};
}

/**
 * 구글 스프레드시트에 데이터를 추가하는 함수
 */
export async function appendToSheet(
  data: PostData & {url: string}
): Promise<void> {
  const values = [
    [
      new Date().toISOString(),
      data.title,
      data.url,
      data.viewCount,
      data.likeCount,
      data.shareCount,
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A:F",
    valueInputOption: "RAW",
    requestBody: {values},
  });
}

/**
 * Firestore에서 문서가 생성되면 LinkedIn 게시물 데이터를 크롤링하여 스프레드시트에 추가하는 Firebase Function
 */
export const scrapeLinkedInPost = functions.firestore
  .document("posts/{postId}")
  .onCreate(async (snap) => {
    const postData = snap.data();
    const url: string = postData?.url;

    if (!url) {
      console.error("No URL found in post data.");
      return;
    }

    try {
      const scrapedData = await getLinkedInPostData(url);
      await appendToSheet({...scrapedData, url});

      await db.collection("scrapedPosts").add({
        title: scrapedData.title,
        url,
        viewCount: scrapedData.viewCount,
        likeCount: scrapedData.likeCount,
        shareCount: scrapedData.shareCount,
      });

      console.log("✅ 데이터 스프레드시트에 추가 완료!");
    } catch (error) {
      console.error("🚨 스크래핑 실패:", error);
    }
  });
