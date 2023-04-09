import request from 'superagent'
import cheerio from 'cheerio'

export async function getPageUrl({ searchKey }){
  try {
    const key = encodeURIComponent(searchKey);
    const response = await request.post(`https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?appid=379020&bk_key=${key}`);
    return { code: 200, data: response };
  } catch (error) {
    return { code: 0, msg: error.msg };
  }
}

export function getPageContent({ pageUrl }){
  return new Promise((resolve, reject) => {
    request
      .post(pageUrl)
      .set('sec-ch-ua', 'Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111')
      .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36')
      .end((err, res) => {
        // 常规的错误处理
        if (err) {
          return reject({ code: 0, data: err });
        }
        resolve({ code: 200, data: res.text });
      })
  })
}

export function getSenseList({ content, pageUrl }){
  try {
    const $ = cheerio.load(content);
    const senseList = [];
    $('#J-polysemant-content li a').each(function (index, element) {
      var $element = $(element);
      senseList.push({ label: $element.html(), value: index === 0 ? pageUrl : `http:${$element.attr('data-href')}` });
    });
    return { code: 200, data: senseList };
  } catch (error) {
    return { code: 0, msg: error.msg };
  }
}

export function getTimeline({ content }){
  try {
    const $ = cheerio.load(content);
    const timeline = []
    $('h2[data-title="人物履历"] ~ .para:not(h2[data-title="人物履历"] ~ .BK-content-margin ~ .para)').each(function (i, element) {
      var $element = $(element);
      const textList = $element.text().split('\n');
      const filterTextList = textList.filter(text => !!text);
      timeline.push({ children: filterTextList[0] });
    });
    return { code: 200, data: timeline };
  } catch (error) {
    return { code: 0, msg: error.msg };
  }
}
