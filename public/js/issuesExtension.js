class issuesExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
      super(viewer, options);
      this._group = null;
      this._button = null;
      this.containerId = null;
      this.hubId = null;
      this.issues = null;
      this.pushPinExtensionName = 'Autodesk.BIM360.Extension.PushPin';
  }

  load() {
    //   console.log('issuesExtension has been loaded');
      return true;
  }

  unload() {
      // Clean our UI elements if we added any
      if (this._group) {
          this._group.removeControl(this._button);
          if (this._group.getNumberOfControls() === 0) {
              this.viewer.toolbar.removeControl(this._group);
          }
      }
    //   console.log('issuesExtension has been unloaded');
      return true;
  }

  onToolbarCreated() {
      // Create a new toolbar group if it doesn't exist
      
      this._group = this.viewer.toolbar.getControl('allMyAwesomeExtensionsToolbar');
      if (!this._group) {
          this._group = new Autodesk.Viewing.UI.ControlGroup('allMyAwesomeExtensionsToolbar');
          this.viewer.toolbar.addControl(this._group);
      }

      // Add a new button to the toolbar group
      this._button = new Autodesk.Viewing.UI.Button('issuesExtensionButton');
      
      this._button.onClick = (ev) => {
        getHub(localStorage.getItem('token'))
      };

      this._button.setToolTip('Instrumentation Panel');
      this._button.addClass('issuesExtensionIcon');
      this._group.addControl(this._button);
  }
}

async function getHub(token){ 
    let hub_id = ''
    await axios.get('https://developer.api.autodesk.com/project/v1/hubs', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then((res) => {
        this.hubId = res.data.data[0].id
        getContainer(token)
    })
    .catch((error) => {
        console.error(error)
    })
}

async function getContainer(token){ 
    let urn = localStorage.getItem('urn')
    await axios.get(`https://developer.api.autodesk.com/project/v1/hubs/${this.hubId}/projects`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then((res) => {
        // console.log(res)
        this.containerId = res.data.data[0].relationships.issues.data.id
        // this.projectId = res.data.data[0].attributes.id
        //b.319b67a2-78d3-411d-a93a-4222de9062d9
        getIssues(token)
    })
    .catch((error) => {
        console.error(error)
    })
}

async function getIssues(token){
    let BASE_URL = 'https://developer.api.autodesk.com';
    var selected = getSelectedNode();
    this.urn = selected.urn
    await axios.get(`${BASE_URL}/issues/v1/containers/${this.containerId}/quality-issues?filter[target_urn]=${selected.urn}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then((res) => {
        this.issues = res
        loadIssues()
        // res.data.data.forEach(res => {
        //     console.log(res)        
        // });
    })
    .catch((error) => {
        console.error(error)
    })
}

async function getItemVersion(token){
    let BASE_URL = 'https://developer.api.autodesk.com';
    
    await axios.get(`${BASE_URL}/project/v1/projects/b.3dcd7fef-85df-41fc-a93a-d09328f35956/folders/b.319b67a2-78d3-411d-a93a-4222de9062d9/contents`, {
    // await axios.get(`https://developer.api.autodesk.com/project/v1/hubs/b.3dcd7fef-85df-41fc-a93a-d09328f35956/projects/b.319b67a2-78d3-411d-a93a-4222de9062d9`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then((res) => {
        console.log(res)         
        // res.data.data.forEach(res => {
        // });
    })
    .catch((error) => {
        console.error(error)
    })
}

function loadIssues(){
    var pushPinExtension = this.viewer.getExtension(this.pushPinExtensionName);
    console.log(pushPinExtension)
    if (this.issues.length > 0) {
        console.log('true 1')
        if (pushPinExtension == null) {
            console.log('true 2')
          var extensionOptions = {
            hideRfisButton: true,
            hideFieldIssuesButton: true,
          };
          this.viewer.loadExtension(this.pushPinExtensionName, extensionOptions).then(function () { showIssues(); }); // show issues (after load extension)
        }
        else
            console.log('else')
          showIssues(); // show issues
    }
}

function showIssues(){
    var _this = this;
    console.log(_this)
    var pushPinExtension = _this.viewer.getExtension(_this.pushPinExtensionName);
    pushPinExtension.removeAllItems();
    pushPinExtension.showAll();
    var selected = getSelectedNode();

    _this.issues.forEach(function (issue) {
        // add the pushpin
        var issueAttributes = issue.attributes;
        var pushpinAttributes = issue.attributes.pushpin_attributes;
        if (pushpinAttributes) {
            issue.type = issue.type.replace('quality_', ''); // temp fix during issues > quality_issues migration
    
            pushpinDataArray.push({
                id: issue.id,
                label: issueAttributes.identifier,
                status: issue.type && issueAttributes.status.indexOf(issue.type) === -1 ? `${issue.type}-${issueAttributes.status}` : issueAttributes.status,
                position: pushpinAttributes.location,
                type: issue.type,
                objectId: pushpinAttributes.object_id,
                viewerState: pushpinAttributes.viewer_state
            });
          } 
        })
    
      pushPinExtension.loadItems(pushpinDataArray);
}

Autodesk.Viewing.theExtensionManager.registerExtension('issuesExtension', issuesExtension);
