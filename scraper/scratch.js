const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');

axios.get('https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?y=2022', {
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
}).then(res => {
  const $ = cheerio.load(res.data);
  $('#ddlExamList option').each((i, el) => {
    console.log($(el).val(), $(el).text());
  });
}).catch(console.error);
