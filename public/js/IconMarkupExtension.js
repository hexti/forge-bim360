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
class IconMarkupExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
        this._icons = options.icons || [];
        this._viewer = viewer
        this._issues = [];
        this.panel = null
        this.token = localStorage.getItem('token')
    }

    load() {
        if (/*this.viewer.model.getInstanceTree()*/ true) {
            this.customize();
        } else {
        }
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
        $('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer label.markup').remove();
        return true;
    }

    customize(){
        const updateIconsCallback = () => {
            if (this._enabled) {
                //this._issues.forEach(issue => {
                    this.updateIcons();
                //});
            }
        };
        this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateIconsCallback);
        this.viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, updateIconsCallback);
        this.viewer.addEventListener(Autodesk.Viewing.HIDE_EVENT, updateIconsCallback);
        this.viewer.addEventListener(Autodesk.Viewing.SHOW_EVENT, updateIconsCallback);
    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('customExtensions');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('customExtensions');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('IconExtension');
        this._button.onClick = (ev) => {
            this._enabled = !this._enabled;
            this.showIcons(this._enabled);
            this._button.setState(this._enabled ? 0 : 1);

        };
        this._button.setToolTip('Anomalias');
        this._button.container.children[0].classList.add('fas', 'fa-exclamation-triangle');
        this._button.container.children[0].style.paddingTop = 0;
        this._group.addControl(this._button);
    }

    async showIcons(show) {
        await this.getIssues()
        let _this = this
        const $viewer = $('#' + _this.viewer.clientContainer.id + ' div.adsk-viewing-viewer');

        // remove previous...
        $('#' + _this.viewer.clientContainer.id + ' div.adsk-viewing-viewer label.markup').remove();
        if (!show) return;

        // do we have anything to show?
        if (_this._icons === undefined || _this.icons === null) return;

        // do we have access to the instance tree?
        const tree = _this.viewer.model.getInstanceTree();
        if (tree === undefined) { console.log('Loading tree...'); return; }

        _this.panel = new BIM360IssuePanel(_this.viewer, _this.viewer.container, 'bim360IssuePanel', 'Problemas');
        const onClick = async (e) => {
            _this.viewer.select($(e.currentTarget).data('id'));
            _this.viewer.utilities.fitToView();

            if (_this.panel) _this.panel.removeAllProperties();

            if(_this.panel.isVisible() == false) _this.panel.setVisible(!_this.panel.isVisible());

            _this.panel.addProperty('Carregando...', '');
            let id = $(e.currentTarget).data('content')

            var selected = getSelectedNode();
            let url = selected.project.split("/");
            let count = url.length - 1
            let containerId = url[count].substring(2);

            const headers = {
                Authorization: `Bearer ${_this.token}`
            }

            axios.get(`https://developer.api.autodesk.com/issues/v1/containers/${containerId}/quality-issues/${id}`, { headers })
                .then(async ({ data: res }) => {
                    const issue = res.data

                    const dateCreated = moment(issue.attributes.created_at)

                    if (_this.panel) {
                        _this.panel.removeAllProperties()
                        _this.panel.addProperty('Titulo', issue.attributes.title, 'Issue ' + issue.attributes.identifier)
                        _this.panel.addProperty('Causa Raiz', issue.attributes.root_cause, 'Issue ' + issue.attributes.identifier)
                        _this.panel.addProperty('Localização', issue.attributes.location_description, 'Issue ' + issue.attributes.identifier)
                        _this.panel.addProperty('Versão', 'V' + issue.attributes.starting_version + (selected.version != issue.attributes.starting_version ? ' (Not current)' : ''), 'Issue ' + issue.attributes.identifier)
                        _this.panel.addProperty('Criado', dateCreated.format('MMMM Do YYYY, h:mm a'), 'Issue ' + issue.attributes.identifier)

                        if (issue.attributes.attachment_count > 0) {
                            const url = issue.relationships.attachments.links.related.replace('//', '@')
                            _this.panel.addProperty('Anexo', `<a href="javascript:void(0);" onclick="openAnexos('${url}')" title="Visualizar" class="text-white"><i class="fas fa-camera"></i> Visualizar</a>`, 'Issue ' + issue.attributes.identifier)
                        }

                        const sortIssue = issue.attributes.custom_attributes

                        sortIssue.sort((a, b) => {
                            if (a.title > b.title) {
                                return 1
                            }
                            if (a.title < b.title) {
                                return -1
                            }
                            return 0
                        })

                        for (const attribute of sortIssue) {
                            if (attribute.type === 'list') {
                                const { data: res } = await axios.get(`https://developer.api.autodesk.com/issues/v2/containers/${containerId}/issue-attribute-definitions?filter[dataType]=list&filter[id]=${attribute.id}`, { headers })

                                if (res.results[0]) {
                                    const options = res.results[0].metadata.list.options

                                    options.forEach((option) => {
                                        if (option.id === attribute.value) {
                                            _this.panel.addProperty(attribute.title, option.value, 'Issue ' + issue.attributes.identifier)
                                        }
                                    })
                                }
                            } else {
                                _this.panel.addProperty(attribute.title, attribute.value || '(sem informações)', 'Issue ' + issue.attributes.identifier)
                            }
                        }
                    } else {
                        throw new TypeError('BIM360IssuePanel não foi instanciada.')
                    }
                })
                .catch((err) => {
                    alert('Ocorreu um problema ao tentar recuperar as informações')
                    console.error(err)
                })
        };

        this._frags = {}

        for (var i = 0; i < this._icons.length; i++) {
            // we need to collect all the fragIds for a given dbId
            const icon = this._icons[i];
            this._frags['dbId' + icon.id] = []

            // create the label for the dbId
            const $label = $(`
                <label class="markup update valign-wrapper" data-id="${icon.id}" data-content="${icon.content}" style="font-size: 15px;">
                    <span class="material-icons material-icons.md-18">${icon.css}</span> ${icon.label || ''}
                </label>
            `);

            const pos = this.viewer.worldToClient(icon.location);

            // position the label center to it
            $label.css('left', (Math.floor(pos.x - $label[0].offsetWidth / 2) - 10) + 'px');
            $label.css('top', (Math.floor(pos.y - $label[0].offsetHeight / 2) -12) + 'px');
            $label.css({'display': this.viewer.isNodeVisible(i) ? 'block' : 'none', 'color': icon.color});
            $label.on('click', onClick);

            $viewer.append($label);

            // now collect the fragIds
            const getChildren = (topParentId, dbId) => {
                if (tree.getChildCount(dbId) === 0)
                    getFrags(topParentId, dbId); // get frags for this leaf child
                tree.enumNodeChildren(dbId, (childId) => {
                    getChildren(topParentId, childId);
                })
            }
            const getFrags = (topParentId, dbId) => {
                tree.enumNodeFragments(dbId, (fragId) => {
                    this._frags['dbId' + topParentId].push(fragId);
                    //if(icon.location){
                        this.updateIcons(); // re-position for each fragId found
                    //}
                });
            }
            getChildren(i, i);

        }
    }

    getModifiedWorldBoundingBox(dbId) {
        var fragList = this.viewer.model.getFragmentList();
        const nodebBox = new THREE.Box3()

        // for each fragId on the list, get the bounding box
        for (const fragId of this._frags['dbId' + dbId]) {
            const fragbBox = new THREE.Box3();
            fragList.getWorldBounds(fragId, fragbBox);
            nodebBox.union(fragbBox); // create a unifed bounding box
        }

        return nodebBox
    }

    updateIcons() {
        $('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer .update').each((_, item) => {
            const id = item.dataset.id;
            // get the center of the dbId (based on its fragIds bounding boxes)
            const pos = this.viewer.worldToClient(this._issues[id].attributes.pushpin_attributes.location);

            item.style.left = (Math.floor(pos.x - item.offsetWidth / 2)+36) + 'px'
            item.style.top = Math.floor(pos.y - item.offsetHeight / 2) + 'px'
            item.style.display = this.viewer.isNodeVisible(id) ? 'block' : 'none'
        })
    }

    async getIssues() {
        this._issues = await getAllIssues()
        this._icons = []
        var id = 0
        var label
        var color

        const selected = getSelectedNode()
        const url = selected.project.split('/')
        const count = url.length - 1
        const containerId = url[count].substr(2)

        for(let i = 0; i < this._issues.length; i++){
            const { id: alerta_id, value: _alerta } = this._issues[i].attributes.custom_attributes.find(({ title }) =>
                str_normalize(title).toLowerCase().substr(0, title.indexOf('(')).trim() === 'nivel de alerta') || {}

            const { id: causa_raiz_id, value: _causa_raiz } = this._issues[i].attributes.custom_attributes.find(({ title }) =>
                str_normalize(title).toLowerCase() === 'causa raiz') || {}

            let alerta
            let causa_raiz

            if (alerta_id) {
                const { results } = await axios.get(`https://developer.api.autodesk.com/issues/v2/containers/${containerId}/issue-attribute-definitions?filter[dataType]=list&filter[id]=${alerta_id}`, {
                    headers: {'Authorization': `Bearer ${this.token}`}
                }).then(({ data }) => data)

                alerta = str_normalize(results[0].metadata.list.options.find(el => el.id === _alerta).value).toLowerCase()
            }

            if (causa_raiz_id) {
                const { results } = await axios.get(`https://developer.api.autodesk.com/issues/v2/containers/${containerId}/issue-attribute-definitions?filter[dataType]=list&filter[id]=${causa_raiz_id}`, {
                    headers: {'Authorization': `Bearer ${this.token}`}
                }).then(({ data }) => data)

                causa_raiz = results[0].metadata.list.options.find(el => el.id === _causa_raiz).value
            }

            switch (alerta) {
                case 'toleravel':
                    color = 'Green'
                    break;

                case 'atencao':
                    color = 'Orange'
                    break;

                case 'critico':
                    color = 'Red'
                    break;

                default:
                    color = 'Black'
            }

            label = '#' + this._issues[i].attributes.identifier + ' - ' + causa_raiz
            this._icons.push({dbId: 5827, label: label, css: "warning", location: this._issues[i].attributes.pushpin_attributes.location, id: id, color: color, content:this._issues[i].id})
            id += 1
        }
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('IconMarkupExtension', IconMarkupExtension);
