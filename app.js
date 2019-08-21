var fs = require("fs");
var htmlparser = require("htmlparser");
var moment = require("moment");
var fs = require("fs");
var path = require("path");
var Canvas = require("canvas");
Canvas.registerFont(fontFile('built titling bd.ttf'), {
  family: 'customFont'
})

function readModuleFile(path, callback) {
  try {
    var filename = require.resolve(path);
    fs.readFile(filename, "utf8", callback);
  } catch (e) {
    callback(e);
  }
}

var spielplan = [];
var strSpielplan = "";

readModuleFile("./aktuell.txt", function (err, words) {
  var handler = new htmlparser.DefaultHandler(
    function (error, dom) {
      if (error) {
        console.log(error);
      } else {
        console.log("finished");
      }
    }, {
      verbose: false,
      ignoreWhitespace: true
    }
  );
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(words);
  var spielplanRaw = handler.dom; //JSON.stringify(handler.dom);
  var staffelInfo;
  for (let i = 0; i < spielplanRaw[0].children.length; i++) {
    const treEle = spielplanRaw[0].children[i];
    if (treEle.attribs.class == "listtexthead") {
      continue;
    }
    if (
      treEle.attribs.class == "jlistTrOdd" &&
      treEle.children[0].children[0].name == "b"
    ) {
      staffelInfo = parseMetaData(treEle);
      continue;
    }
    if (
      treEle.attribs.class == "jlistTrEven" ||
      treEle.attribs.class == "jlistTrOdd"
    ) {
      var spieldata = parseSpielData(treEle);
      spielplan.push({
        staffelInfo,
        spieldata
      });
    }
  }
  sortByTimeStamp();

  // spielplan.forEach((element, index) => {
  //   if (index <= 9) {
  //     strSpielplan += fillText(element);
  //   }
  // });
  writeOnImage();
});

function parseMetaData(treEle) {
  var info = treEle.children[0].children[0].children[0].children[0].data;
  var words = info.split(",");
  return words[0] + " - " + words[1];
}

function parseSpielData(treEle) {
  var tag = treEle.children[3].children[0].data;
  var datum = treEle.children[4].children[0].data;
  var zeit = treEle.children[5].children[0].data;
  var spieltag = treEle.children[6].children[0].data;
  var heim = treEle.children[7].children[0].data;
  var gast = treEle.children[8].children[0].data;
  return {
    tag,
    datum,
    zeit,
    spieltag,
    heim,
    gast
  };
}

function sortByTimeStamp() {
  spielplan = spielplan.sort(function (a, b) {
    var datum1 = moment(a.spieldata["datum"], "DD.MM.YYYY").valueOf();
    var datum2 = moment(b.spieldata["datum"], "DD.MM.YYYY").valueOf();
    if (datum1 == datum2) {
      var zeit1str = a.spieldata["zeit"];
      var zeit1 = parseInt(zeit1str.replace(":", ""));
      var zeit2str = b.spieldata["zeit"];
      var zeit2 = parseInt(zeit2str.replace(":", ""));
      return zeit1 > zeit2 ? 1 : zeit1 < zeit2 ? -1 : 0;
    }
    return datum1 > datum2 ? 1 : datum1 < datum2 ? -1 : 0;
  });
}

function fontFile(name) {
  var fontPath = path.join(__dirname, "/fonts/", name);
  return fontPath;
}

function writeOnImage() {
  //   Canvas.registerFont(fontFile("ARBLI___0.ttf"), { family: "ARBLI___0" });

  var canvas = Canvas.createCanvas(1600, 868);
  var ctx = canvas.getContext("2d");

  var Image = Canvas.Image;
  var img = new Image();
  img.src = "./image/current.jpg";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ededed";

  //ctx.font = "bold 20px Courier New";
  ctx.font = '20px "customFont"';
  var left = 350;
  var top = 200;

  ctx.textAlign = "left";
  spielplan.forEach(element => {
    var text = fillText(element);
    ctx.fillText(text, left, top);
    top += 68;
  });

  ctx.font = '40px Arial';
  ctx.fillStyle = "#9c3d3d";
  ctx.fillText(spielplan[0].spieldata.datum + " - " + spielplan[spielplan.length - 1].spieldata.datum, 620, 140);

  canvas
    .createPNGStream()
    .pipe(fs.createWriteStream(path.join(__dirname, "font.png")));
}
var lastDate = "";

function fillText(element) {
  var rowStr;
  // if (lastDate === element.spieldata.tag) {
  //   rowStr =
  //     element.staffelInfo +
  //     " - " +
  //     element.spieldata.zeit +
  //     ": " +
  //     element.spieldata.heim +
  //     " : " +
  //     element.spieldata.gast +
  //     "\n\n";
  // } else {
  rowStr =
    element.spieldata.tag +
    "," +
    element.spieldata.datum +
    " - " +
    element.staffelInfo +
    "\n";
  rowStr +=
    element.spieldata.zeit +
    " Uhr: " +
    element.spieldata.heim +
    " : " +
    element.spieldata.gast +
    "\n\n";
  //}
  //lastDate = element.spieldata.tag;
  rowStr = killSpaces(rowStr);
  return rowStr;
}

function killSpaces(rowStr) {
  return rowStr.trim();
}