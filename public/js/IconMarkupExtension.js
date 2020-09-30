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
        this._issues = this.getIssues();
    }

    load() {
        if (/*this.viewer.model.getInstanceTree()*/ true) {
            this.customize();
        } else {
            this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.customize());
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
        this._button.setToolTip('Show Temperature');
        this._button.container.children[0].classList.add('fas', 'fa-thermometer-full');
        this._group.addControl(this._button);
    }

    showIcons(show) {
        const $viewer = $('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer');

        // remove previous...
        $('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer label.markup').remove();
        if (!show) return;

        // do we have anything to show?
        if (this._icons === undefined || this.icons === null) return;

        // do we have access to the instance tree?
        const tree = this.viewer.model.getInstanceTree();
        if (tree === undefined) { console.log('Loading tree...'); return; }

        const onClick = (e) => {
            this.viewer.select($(e.currentTarget).data('id'));
            this.viewer.utilities.fitToView();
        };

        this._frags = {}

        for (var i = 0; i < this._icons.length; i++) {
            // we need to collect all the fragIds for a given dbId
            const icon = this._icons[i];
            this._frags['dbId' + icon.id] = []

            // create the label for the dbId
            const $label = $(`
            <label class="markup update" data-id="${icon.id}">
                <span class="${icon.css}"> ${icon.label || ''}</span>
            </label>
            `);
            
            const pos = this.viewer.worldToClient(icon.location);

            // position the label center to it
            $label.css('left', Math.floor(pos.x - $label[0].offsetWidth / 2) + 'px');
            $label.css('top', Math.floor(pos.y - $label[0].offsetHeight / 2) + 'px');
            $label.css({'display': this.viewer.isNodeVisible(i) ? 'block' : 'none', 'color': 'Tomato'});
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
        for (const label of $('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer .update')) {
            const $label = $(label);
            const id = $label.data('id');

            // get the center of the dbId (based on its fragIds bounding boxes)
            //const pos = this.viewer.worldToClient(this.getModifiedWorldBoundingBox(id).center());
            const pos = this.viewer.worldToClient(this._issues[id].attributes.pushpin_attributes.location);

            // position the label center to it
            $label.css('left', Math.floor(pos.x - $label[0].offsetWidth / 2) + 'px');
            $label.css('top', Math.floor(pos.y - $label[0].offsetHeight / 2) + 'px');
            $label.css('display', this.viewer.isNodeVisible(id) ? 'block' : 'none');
        }
    }

    getIssues() {
        var selected = getSelectedNode();

        let url = selected.project.split("/");
        let count = url.length - 1
        let containerId = url[count].substring(2);

        $.ajax({
            url: `https://developer.api.autodesk.com/issues/v1/containers/${containerId}/quality-issues?filter[target_urn]=${selected.urn}`,
            type: 'GET',
            // Fetch the stored token from localStorage and set in the header
            headers: {"Authorization": `Bearer ${localStorage.getItem('token')}`},
            error: function(XMLHttpRequest, textStatus, errorThrown){
              alert('Cannot read Issues');
              return null
            },
            success: function(data){
                data.data
                this._issues = data.data
                this._icons = []
                var id = 0
                data.data.forEach(issue => {
                    this._icons.push({dbId: 5827, label: "30&#176;C", css: "fas fa-exclamation-triangle", location: issue.attributes.pushpin_attributes.location, id: id})
                    id += 1
                });
                console.log(id)
            }.bind(this)
        });
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('IconMarkupExtension', IconMarkupExtension);