/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////


// *******************************************
// BIM 360 Issue Extension
// *******************************************
function BIM360IssueExtension(viewer, options) {
  Autodesk.Viewing.Extension.call(this, viewer, options);
  this.viewer = viewer;
  this.panel = null; // create the panel variable
  this.containerId = null;
  this.hubId = null;
  this.issues = null;
  this.pushPinExtensionName = 'Autodesk.BIM360.Extension.PushPin';
  this.iconMarkupExtensionName = 'Autodesk.BIM360.Extension.PushPin';
}

BIM360IssueExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
BIM360IssueExtension.prototype.constructor = BIM360IssueExtension;

BIM360IssueExtension.prototype.load = function () {
  if (this.viewer.toolbar) {
    // Toolbar is already available, create the UI
    this.createUI();
  } else {
    // Toolbar hasn't been created yet, wait until we get notification of its creation
    this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
    this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
  }
  return true;
};

BIM360IssueExtension.prototype.onToolbarCreated = function () {
  this.viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
  this.onToolbarCreatedBinded = null;
  this.createUI();
};

BIM360IssueExtension.prototype.createUI = function () {
  var _this = this;

  // SubToolbar
  this.subToolbar = (this.viewer.toolbar.getControl("MyAppToolbar") ?
    this.viewer.toolbar.getControl("MyAppToolbar") :
    new Autodesk.Viewing.UI.ControlGroup('MyAppToolbar'));
  this.viewer.toolbar.addControl(this.subToolbar);

  // load/render issues button
  {
    var loadQualityIssues = new Autodesk.Viewing.UI.Button('loadQualityIssues');
    loadQualityIssues.onClick = function (e) {

      // check if the panel is created or not
      if (_this.panel == null) {
        _this.panel = new BIM360IssuePanel(_this.viewer, _this.viewer.container, 'bim360IssuePanel', 'Problemas');
      }
      // show/hide docking panel
      _this.panel.setVisible(!_this.panel.isVisible());

      // if panel is NOT visible, exit the function
      if (!_this.panel.isVisible()) return;

      // ok, it's visible, let's load the issues
      _this.loadIssues();
    };
    loadQualityIssues.addClass('loadQualityIssues');
    loadQualityIssues.setToolTip('Informações de Anomalias');
    this.subToolbar.addControl(loadQualityIssues);
  }

  // create quality issue
  {
    var createQualityIssues = new Autodesk.Viewing.UI.Button('createQualityIssues');
    createQualityIssues.onClick = function (e) {
      var pushPinExtension = _this.viewer.getExtension(_this.pushPinExtensionName);
      if (pushPinExtension == null) {
        var extensionOptions = {
          hideRfisButton: true,
          hideFieldIssuesButton: true,
        };
        _this.viewer.loadExtension(_this.pushPinExtensionName, extensionOptions).then(function () { _this.createIssue(); });
      }
      else
        _this.createIssue(); // show issues
    };
    createQualityIssues.addClass('createQualityIssues');
    createQualityIssues.setToolTip('Create Issues');
    // this.subToolbar.addControl(createQualityIssues); // aqui faz a chama da criacao do botao de cadastro de Issue
  }
};

BIM360IssueExtension.prototype.createIssue = function () {
  var _this = this;
  var pushPinExtension = _this.viewer.getExtension(_this.pushPinExtensionName);

  var issueLabel = prompt("Enter issue label: ");
  if (issueLabel === null) return;

  // prepare to end creation...
  pushPinExtension.pushPinManager.addEventListener('pushpin.created', function (e) {
    pushPinExtension.pushPinManager.removeEventListener('pushpin.created', arguments.callee);
    pushPinExtension.endCreateItem();

    // now prepare the data
    var selected = getSelectedNode();
    var target_urn = selected.urn.split('?')[0];
    var starting_version = Number.parseInt(selected.version);
    // https://forge.autodesk.com/en/docs/bim360/v1/tutorials/pushpins/create-pushpin/
    // Once the user clicks the ``Create Pushpin`` button (see step 3), you need to grab the current position of the newly created pushpin and the pushpin data using its ID, which is automatically set to ``0``.

      //from viewer 7.0, it looks the default id for new item is not 0 anymore
      //var issue = pushPinExtension.getItemById('0');
      //we seem to have to get it from the first item of pushpin list, which is always the latest new one
   var issue = pushPinExtension.getItemById(pushPinExtension.pushPinManager.pushPinList[0].itemData.id );
    if (issue === null) return; // safeguard
    var data = {
      type: 'quality_issues',//issue.type,
      attributes: {
        title: issue.label, // In our example, this is the ``title`` the user sets in the form data (see step 3).
        // The extension retrieved the ``type`` and ``status`` properties in step 3, concatenated them, added a dash, and
        // assigned the new string to the ``status`` property of the newly created pushpin object. For example, ``issues-
        // open``.
        // You now need to extract the ``status`` (``open``) from the pushpin object.
        status: issue.status.split('-')[1] || issue.status,
        // The ``target_urn`` is the ID of the document (``item``) associated with an issue; see step 1.
        target_urn: target_urn,
        starting_version: starting_version, // See step 1 for the version ID.
        // The issue type ID and issue subtype ID. See GET ng-issue-types for more details.
        //ng_issue_subtype_id: "f6689e90-12ee-4cc8-af7a-afe10a37eeaa",
        ng_issue_type_id: "35f5c820-1e13-41e2-b553-0355b2b8b3dd",
        // ``sheet_metadata`` is the sheet in the document associated with the pushpin.
        sheet_metadata: { // `viewerApp.selectedItem` references the current sheet
          is3D: this.viewer.model.is3D,
          sheetGuid: this.viewer.model.getDocumentNode().data.guid,
          sheetName: this.viewer.model.getDocumentNode().data.name
        },
        pushpin_attributes: { // Data about the pushpin
          type: 'TwoDVectorPushpin', // This is the only type currently available
          object_id: issue.objectId, // (Only for 3D models) The object the pushpin is situated on.
          location: issue.position, // The x, y, z coordinates of the pushpin.
          viewer_state: issue.viewerState // The current viewer state. For example, angle, camera, zoom.
        },
      }
    };

    // submit data
    _this.getContainerId(selected.project, selected.urn, function () {
      var urn = btoa(target_urn.split('?')[0]);
      jQuery.post({
          url: '/api/forge/bim360/container/' + _this.containerId + '/issues/' + urn,
        contentType: 'application/json',
        data: JSON.stringify({ data: data }),
        success: function (res) {
          _this.loadIssues();
        },
        error: function (err) {
          // console.log(err.responseText);
          pushPinExtension.pushPinManager.removeItemById('0');
          alert('Cannot create issue');
        }
      });
    });
  });

  // start asking for the push location
  pushPinExtension.startCreateItem({ label: issueLabel, status: 'open', type: 'issues' });
}

BIM360IssueExtension.prototype.submitNewIssue = function () {

};


BIM360IssueExtension.prototype.unload = function () {
  this.viewer.toolbar.removeControl(this.subToolbar);
  return true;
};

Autodesk.Viewing.theExtensionManager.registerExtension('BIM360IssueExtension', BIM360IssueExtension);


// *******************************************
// BIM 360 Issue Panel
// *******************************************
function BIM360IssuePanel(viewer, container, id, title, options) {
  this.viewer = viewer;
  Autodesk.Viewing.UI.PropertyPanel.call(this, container, id, title, options);
}
BIM360IssuePanel.prototype = Object.create(Autodesk.Viewing.UI.PropertyPanel.prototype);
BIM360IssuePanel.prototype.constructor = BIM360IssuePanel;

// *******************************************
// Issue specific features
// *******************************************
BIM360IssueExtension.prototype.loadIssues = function (containerId, urn) {

  //probably it is unneccesary to get container id and urn again
  //because Pushpin initialization has done.
  //but still keep these line
  var _this = this;
  var selected = getSelectedNode();

  _this.getContainerId(selected.project, selected.urn, function () {
    _this.getIssues(_this.hubId, _this.containerId, selected.urn, true);
  });
}

BIM360IssueExtension.prototype.getContainerId = function (href, urn, cb) {
  var _this = this;
  var selected = getSelectedNode();
  if (_this.panel) {
    _this.panel.removeAllProperties();
    _this.panel.addProperty('Carregando...', '');
  }

  let url = selected.project.split("/");
  let count = url.length - 1
  _this.containerId = url[count].substring(2);
  _this.hubId = selected.urn;
  cb();
}

BIM360IssueExtension.prototype.getIssues = async function (accountId, containerId, urn) {
  var _this = this;
  _this.issues = []

  _this.issues = await getAllIssues()
//  _this.issues = x({filtros, validacao, nivelAlerta, face, localizacao}, getSelectedNode)

 if(_this.issues.length){
   // do we have issues on this document?
   var pushPinExtension = _this.viewer.getExtension(_this.pushPinExtensionName);
   if (_this.panel) _this.panel.removeAllProperties();
   if (_this.issues.length > 0) {
     if (pushPinExtension == null) {
       var extensionOptions = {
         hideRfisButton: true,
         hideFieldIssuesButton: true,
       };
       _this.viewer.loadExtension(_this.pushPinExtensionName, extensionOptions).then(function () { _this.showIssues(); }); // show issues (after load extension)
     }
     else
       _this.showIssues(); // show issues
   }
   else {
     if (_this.panel) _this.panel.addProperty('Nem uma issue encontrada', 'Utilize outros filtros');
   }
 }

}

BIM360IssueExtension.prototype.showIssues = async function () {
  var _this = this;

  //remove the list of last time
  var pushPinExtension = _this.viewer.getExtension(_this.pushPinExtensionName);
  pushPinExtension.removeAllItems();
  pushPinExtension.showAll();
  var selected = getSelectedNode();
  let token = localStorage.getItem('token')

  //migrate to viewer 7.0
  //	extension.loadItems([data])
    var pushpinDataArray = [];

    _this.issues.sort(function (a, b) {
      if (a.attributes.identifier > b.attributes.identifier) {
        return 1;
      }
      if (a.attributes.identifier < b.attributes.identifier) {
        return -1;
      }
      return 0;
    });

  for(const issue of _this.issues) {
    let sortIssue = issue.attributes.custom_attributes

    sortIssue.sort(function (a, b) {
      if (a.title > b.title) {
        return 1;
      }
      if (a.title < b.title) {
        return -1;
      }
      return 0;
    });

    var dateCreated = moment(issue.attributes.created_at);
    // show issue on panel
    if (_this.panel) {
      _this.panel.addProperty('Titulo', issue.attributes.title, 'Issue ' + issue.attributes.identifier);
      _this.panel.addProperty('Causa Raiz', issue.attributes.root_cause, 'Issue ' + issue.attributes.identifier);
      _this.panel.addProperty('Localização', issue.attributes.location_description, 'Issue ' + issue.attributes.identifier);
      _this.panel.addProperty('Versão', 'V' + issue.attributes.starting_version + (selected.version != issue.attributes.starting_version ? ' (Not current)' : ''), 'Issue ' + issue.attributes.identifier);
      _this.panel.addProperty('Criado', dateCreated.format('MMMM Do YYYY, h:mm a'), 'Issue ' + issue.attributes.identifier);
      if(issue.attributes.attachment_count > 0){
        let url = issue.relationships.attachments.links.related.replace('//', '@')
        _this.panel.addProperty('Anexo', `<a href="javascript:void(0);" onclick="openAnexos('${url}')" title="Visualizar" class="text-white"><i class="fas fa-camera"></i> Visualizar</a>`, 'Issue ' + issue.attributes.identifier);
      }

      for (const attribute of sortIssue) {
        if(attribute.type === 'list'){
          let a = await axios.get(`https://developer.api.autodesk.com/issues/v2/containers/${_this.containerId}/issue-attribute-definitions?filter[dataType]=list&filter[id]=${attribute.id}`, {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          })
          let options = a.data.results[0].metadata.list.options
          options.forEach(option => {
            if(option.id === attribute.value){
              _this.panel.addProperty(attribute.title, option.value, 'Issue ' + issue.attributes.identifier);
            }
          });
        }else{
          _this.panel.addProperty(attribute.title, attribute.value, 'Issue ' + issue.attributes.identifier);
        }
      }
    }

    // add the pushpin
    var issueAttributes = issue.attributes;
    var pushpinAttributes = issue.attributes.pushpin_attributes;

    if (pushpinAttributes) {
        issue.type = issue.type.replace('quality_', ''); // temp fix during issues > quality_issues migration

        pushpinDataArray.push({
            id: issue.id,
            label: 'Problema #' + issueAttributes.identifier + ' - ' + issueAttributes.root_cause,
            status: issue.type && issueAttributes.status.indexOf(issue.type) === -1 ? `${issue.type}-${issueAttributes.status}` : issueAttributes.status,
            position: pushpinAttributes.location,
            type: issue.type,
            objectId: pushpinAttributes.object_id,
            viewerState: pushpinAttributes.viewer_state
        });
      }
    }

  pushPinExtension.loadItemsV2(pushpinDataArray);
}

// *******************************************
// Helper functions
// *******************************************
function getSelectedNode() {
  var node = $('#userHubs').jstree(true).get_selected(true)[0];
  var parent;
  for (var i = 0; i < node.parents.length; i++) {
    var p = node.parents[i];
    if (p.indexOf('hubs') > 0 && p.indexOf('projects') > 0) parent = p;
  }

  if (node.id.indexOf('|') > -1) { // Plans folder
    var params = node.id.split("|");
    return { 'project': parent, 'urn': params[0], 'version': params[3] };
  }
  else { // other folders
    for (var i = 0; i < node.parents.length; i++) {
      var parent = node.parents[i];
      if (parent.indexOf('hubs') > 0 && parent.indexOf('projects') > 0) {
        var version = atob(node.id.replace('_', '/')).split('=')[1]
        return { 'project': parent, 'urn': (node.type == 'versions' ? id(node.parents[0]) : ''), version: version };
      }
    }
  }
  return null;
}

function id(href) {
  return href.substr(href.lastIndexOf('/') + 1, href.length);
}

function stringOrEmpty(str) {
  if (str == null) return '';
  return str;
}

function switchView(level) {
  viewer.restoreState(viewStates[level]);
}

  // get view state from console
  // v=viewer.getState();delete(v.seedURN);delete(v.objectSet);delete(v.renderOptions);delete(v.cutplanes);JSON.stringify(v)

var viewStates = {
  "view1": {"viewport":{"name":"","eye":[363.4573315717432,454.00539656374525,653.3954041272863],"target":[-182.44454194347043,-270.9675826967336,-373.32406499505953],"up":[-0.2483724861641897,0.8485857169975204,-0.4671331598424841],"worldUpVector":[0,1,0],"pivotPoint":[37.81322646507962,43.88141314081513,40.03438798259458],"distanceToOrbit":806.276539067982,"aspectRatio":1.902061855670103,"projection":"perspective","isOrthographic":false,"fieldOfView":22.918312146742387}},
  "view2": {"viewport":{"name":"","eye":[99.97230916985185,568.8908329153263,-120.01029576775429],"target":[81.51428263715795,-753.2667313893775,239.58144614031337],"up":[-0.04946167020653998,0.2627619643160633,0.963592078261929],"worldUpVector":[0,1,0],"pivotPoint":[48.193467686450305,18.558605555111114,11.800714547187397],"distanceToOrbit":566.2807733860644,"aspectRatio":1.902061855670103,"projection":"perspective","isOrthographic":false,"fieldOfView":22.918312146742387}},
  "view3": {"viewport":{"name":"","eye":[-424.2691476449123,542.6505164276925,279.13303803246106],"target":[268.0259078155068,-460.8007897974295,-346.6149756761407],"up":[0.5432521913940823,0.6810027141839978,-0.4910319336046847],"worldUpVector":[0,1,0],"pivotPoint":[24.323528772924313,57.16362725342778,128.62718425779093],"distanceToOrbit":650.8747272159101,"aspectRatio":1.902061855670103,"projection":"perspective","isOrthographic":false,"fieldOfView":22.918312146742387}},
}

async function openAnexos(url) {
    const options = { el: '.content .viewer .card' }

    loadingOverlay(options)

    await this.getAnexos(url)

    options.exibir = false

    loadingOverlay(options)

    $('.modal.anexo').modal()
}

async function getAnexos(url) {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    const newUrl = url.replace('@', '//')
    const responseType = 'blob'

    $('#img').html('')

    const { data } = await axios.get(`${newUrl}`, { headers }).then(res => res.data)

    let i = 1

    for (const attach of data) {
        const img = document.createElement('img')

        const blob = await axios.get(`${attach.attributes.url}`, { headers, responseType }).then(res => res.data)

        const reader = new FileReader

        const load = () => new Promise((resolve) => {
            reader.addEventListener('load', function () {
                const div = document.createElement('div')
                const url = this.result

                if (i++ < data.length) {
                    div.style.marginBottom = '1.5rem'
                }

                img.setAttribute('src', url)
                img.setAttribute('class', 'img-thumbnail')
                div.append(img, attach.attributes.name)

                $('#img').append(div)

                resolve()
            })

            reader.readAsDataURL(blob)
        })

        await load()
    }
}
