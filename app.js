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
router.get("/dexur/icd/:query", (req, _res) => {
  let params=req.params;
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
app.use("/api", router);

app.listen(PORT, () => {
  console.log(`WebScraper app is listening on port ${PORT}!`)
});