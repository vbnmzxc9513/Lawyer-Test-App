const https = require('https');
[2021, 2020, 2023].forEach(year => {
  https.get('https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?y=' + year, {rejectUnauthorized:false}, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const m = d.match(/<option value=\"(\d{6})\">([^<]+)<\/option>/g);
      if(m) {
        m.forEach(x => {
          if(x.includes('律師') || x.includes('司')) console.log(year, x);
        });
      }
    });
  });
});
