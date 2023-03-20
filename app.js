const express = require("express");
const request = require("request");
const app = express();
const bodyParser = require('body-parser');
const path = require("path");
const jsdom = require("jsdom");
const minify = require('html-minifier').minify;

const minifyOptions={
  collapseInlineTagWhitespace: true,
  collapseWhitespace: true,
  html5: true,
  minifyCSS: true,
  minifyJS: true,
  preserveLineBreaks: false,
  removeComments: true
};

const PORT = process.env.PORT || 5000;
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json()); 
router.use((req, res, next) => { // router middleware
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN || "*");
    next();
});

// http://localhost:5000/api/dexur/icd/mood
router.get("/dexur/icd/:query", (_req, _res) => {
  let params=_req.params;
  let query=params["query"]; // depress | schizophrenia
  let endpoint="https://dexur.com/icd/search/?q="+query // let endpoint="https://dexur.com/icd/search/?q=depress"

  request({ 
      url: endpoint
  },(err, res, body) => {
    let str=res.body;
    let htmlStr = minify(str, minifyOptions);
    const outputObj={
      "search": query,
      "results": []
    };
    const dom = new jsdom.JSDOM(htmlStr);
    const document = dom.window.document;
    const trEles=document.querySelectorAll('table.table.table-bordered.table-striped tr');
    for(let trEle of trEles) {
        let tdEles=trEle.querySelectorAll('td');
        if(tdEles.length>0) {
            let code=tdEles[0].textContent;
            let desc=tdEles[1].textContent;
            let version=tdEles[2].textContent;
            let obj={
              "code":code,
              "description": desc,
              "version": version
            };
            outputObj["results"].push(obj);
        }
    } // end for-loop
    
    if (err) {
      return _res.status(500).json({ 
        type: "error", 
        message: (err !== null && typeof err.message !== "undefined") ? err.message : "Error. Unabled to retrieve ICD Code value(s) from dexur.com"
      });
    }
    _res.json(outputObj);
  })
}); 

// REGISTER ALL ROUTES -------------------------------
// all of the routes will be prefixed with /api
app.use("/api", router)
.set("view engine", "html")
.get("/", (req, res) => res.send("<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><title>Error 404 | Page Not Found</title><style>html,body{overflow:hidden}div{text-align:center; height: 60vh; margin:20vh auto;}</style></head><body><div><h1>𝟺𝟶𝟺</h1><h3>⚠ 𝖯𝖺𝗀𝖾 𝗇𝗈𝗍 𝖿𝗈𝗎𝗇𝖽</h3><h4>𝖲𝖾𝗅𝖾𝖼𝗍 <a href='api/dexur/icd/panic'>𝗅𝗂𝗇𝗄</a> 𝗍𝗈 𝗋𝖾𝖽𝗂𝗋𝖾𝖼𝗍 𝗉𝖺𝗀𝖾 𝗍𝗈 𝗌𝖺𝗆𝗉𝗅𝖾 𝖠𝖯𝖨 𝗐𝗁𝖾𝗋𝖾 <mark>𝚚𝚞𝚎𝚛𝚢=❝𝚙𝚊𝚗𝚒𝚌❞</mark></h4></div></body></html>"))
.listen(PORT, () => {
  console.log(`WebScraper app is listening on port ${PORT}!`)
});