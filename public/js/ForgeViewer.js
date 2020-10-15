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
    var selected = getSelectedNode();
    let url = selected.project.split("/");
    let count = url.length - 1
    let containerId = url[count].substring(2);

    axios.get(`https://developer.api.autodesk.com/issues/v2/containers/${containerId}/issue-attribute-definitions?filter[dataType]=list`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then((res) => {
      let options = '<option value="">Selecione ...</option>'

      res.data.results[1].metadata.list.options.forEach(element => {
        options += `<option value="${element.id}">${element.value}</option>`
      });

      $("#nivelAlerta").html(options).show();
    })
    .catch((error) => {
        console.error(error)
    })
    
    //Causa raiz
    axios.get(`https://developer.api.autodesk.com/issues/v1/containers/${containerId}/root-causes`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then((res) => {
      let options = '<option value="">Selecione ...</option>'
      
      res.data.data.forEach(element => {
        options += `<option value="${element.id}">${element.attributes.title}</option>`
      });
      $("#causaRaiz").html(options).show();
    })
    .catch((error) => {
      console.error(error)
    })
    
    //Issues para popular o filtro
    axios.get(`https://developer.api.autodesk.com/issues/v1/containers/${containerId}/quality-issues?filter[target_urn]=${selected.urn}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then((res) => {
      let options = '<option value="">Selecione ...</option>'
      
      res.data.data.forEach(element => {
        options += `<option value="${element.id}">${element.attributes.identifier}</option>`
      });
      
      $("#issueId").html(options).show();
    })
    .catch((error) => {
      console.error(error)
    })

    $('#btn-search-issues').show()

    viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer'), { extensions: [ 'Autodesk.DocumentBrowser', 'BIM360IssueExtension', 'IconMarkupExtension'] });
    viewer.start();
    var documentId = 'urn:' + urn;
    localStorage.setItem('urn', urn);
    Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
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

function getForgeToken(callback) {
  fetch('/api/forge/oauth/token').then(res => {
    res.json().then(data => {
      localStorage.setItem('token', data.access_token);
      callback(data.access_token, data.expires_in);
    });
  });
}