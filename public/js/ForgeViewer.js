var viewer;

// @urn the model to show
// @viewablesId which viewables to show, applies to BIM 360 Plans folder
function launchViewer(urn, viewableId) {
  var options = {
    env: 'AutodeskProduction',
    getAccessToken: getForgeToken,
    api: 'derivativeV2' + (atob(urn.replace('_', '/')).indexOf('emea') > -1 ? '_EU' : '') // handle BIM 360 US and EU regions
  }; 
  
  Autodesk.Viewing.Initializer(options, () => {
    viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer'), { extensions: [ 'Autodesk.DocumentBrowser', 'BIM360IssueExtension', 'markup3d'] });
    viewer.start(onSuccess);
    var documentId = 'urn:' + urn;
    localStorage.setItem('urn', urn);
    Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);

    function onSuccess() {
      viewer.setBackgroundColor(0,0,0, 155,155,155);
      viewer.impl.toggleGroundShadow(true);
      viewer.loadExtension("markup3d");
      initializeMarkup();
    }
  });

  function onDocumentLoadSuccess(doc) {
    // if a viewableId was specified, load that view, otherwise the default view
    var viewables = (viewableId ? doc.getRoot().findByGuid(viewableId) : doc.getRoot().getDefaultGeometry());
    viewer.loadDocumentNode(doc, viewables).then(i => {
      // any additional action here?
    });
  }

  function onDocumentLoadFailure(viewerErrorCode) {
    console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
  }
}

function initializeMarkup(){
  var elem = $("label");
  // create 20 random markup points
  // where icon is 0="Issue", 1="BIMIQ_Warning", 2="RFI", 3="BIMIQ_Hazard"
  var dummyData = [];
  for (let i=0; i<20; i++) {
      dummyData.push({
          icon:  Math.round(Math.random()*3),  
          x: Math.random()*300-150, 
          y: Math.random()*50-20, 
          z: Math.random()*150-130
      });
  }      
  
  window.dispatchEvent(new CustomEvent('newData', {'detail': dummyData}));

  function moveLabel(p) {
      elem.style.left = ((p.x + 1)/2 * window.innerWidth) + 'px';
      elem.style.top =  (-(p.y - 1)/2 * window.innerHeight) + 'px';            
  }
  // listen for the 'Markup' event, to re-position our <DIV> POPUP box
  window.addEventListener("onMarkupMove", e=>{moveLabel(e.detail)}, false)
  window.addEventListener("onMarkupClick", e=>{
      elem.style.display = "block";
      moveLabel(e.detail);
      elem.innerHTML = `<img src="img/${(e.detail.id%6)}.jpg"><br>Markup ID:${e.detail.id}`;
  }, false);
}

function getForgeToken(callback) {
  fetch('/api/forge/oauth/token').then(res => {
    res.json().then(data => {
      localStorage.setItem('token', data.access_token);
      callback(data.access_token, data.expires_in);
    });
  });
}
