/**
 *
 * @param {filtros, validacao, nivelAlerta, face, localizacao} parameters
 */
async function getAllIssues(){
  let issues = []
  let selected = getSelectedNode();
  let url = selected.project.split("/");
  let count = url.length - 1
  let containerId = url[count].substring(2);
  let token = localStorage.getItem('token')

  var causaRaiz = ''
  causaRaiz = localStorage.getItem('causaRaiz')
  var nivelAlerta = localStorage.getItem('nivelAlerta')
  var issueId = localStorage.getItem('issueId')
  var localizacao = localStorage.getItem('localizacao')
  var face = localStorage.getItem('face')
  let filtros = '';

  if (nivelAlerta === '') nivelAlerta = false
  if (face === '') face = false
  if (localizacao === 'undefined') localizacao = false

  validacao = 0

  if(nivelAlerta && !localizacao && !face){
    validacao = 1
  }

  if(nivelAlerta && localizacao && !face){
    validacao = 2
  }

  if(nivelAlerta && !localizacao && face){
    validacao = 3
  }

  if(nivelAlerta && localizacao && face){
    validacao = 4
  }

  if(!nivelAlerta && localizacao && !face){
    validacao = 5
  }

  if(!nivelAlerta && localizacao && face){
    validacao = 6
  }

  if(!nivelAlerta && !localizacao && face){
    validacao = 7
  }

  if(causaRaiz){
    filtros += '&filter[root_cause_id]='+causaRaiz
  }

  if(issueId){
    filtros += '&filter[id]='+issueId
  }

  await $.ajax({
    url: `https://developer.api.autodesk.com/issues/v1/containers/${containerId}/quality-issues?filter[target_urn]=${selected.urn}`,
    // url: `https://developer.api.autodesk.com/issues/v2/containers/bb280c0e-687d-4e33-b662-ad12381208e8/issues?sortBy=-displayId&filter[linkedDocumentUrn]=urn:adsk.wipprod:dm.lineage:DRuqbKMqS1K-_bNoKbgjng@1&filter[status]=draft,open,answered,work_completed,ready_to_inspect,not_approved,in_dispute`,
    type: 'GET',
    // Fetch the stored token from localStorage and set in the header
    headers: {"Authorization": `Bearer ${token}`},
    error: function(XMLHttpRequest, textStatus, errorThrown){
      alert('Sem resultado de issue para essa consulta');
    },
    success: function(data){
      let all_issues = data.data
      if(validacao > 0){
        all_issues.forEach(function (issue, key, array) {
        //   if(validacao == 1){
        //     issue.attributes.custom_attributes.forEach(attribute => {
        //       if(attribute.type == 'list' && attribute.id == "7b5ba1f6-2fe0-427b-a2e1-ba0fc7819b35" && attribute.value == nivelAlerta){
                issues.push(all_issues[key])
        //       }
        //     })
        //   }

        //   if(validacao == 2){
        //     issue.attributes.custom_attributes.forEach(attribute => {
        //       if(attribute.type == 'list' && attribute.id == "7b5ba1f6-2fe0-427b-a2e1-ba0fc7819b35" && attribute.value == nivelAlerta && issue.attributes.location_description == localizacao){
        //         issues.push(all_issues[key])
        //       }
        //     })
        //   }

        //   if(validacao == 3){
        //     let insert = [ nivel => false, loc => false ]
        //     issue.attributes.custom_attributes.forEach(attribute => {
        //       if(attribute.type == 'list' && attribute.id == "7b5ba1f6-2fe0-427b-a2e1-ba0fc7819b35" && attribute.value == nivelAlerta){
        //         insert.nivel = true
        //       }

        //       if(attribute.type == 'list' && attribute.id == "3ca62377-1e77-40dc-87c8-192fc008e6c6" && attribute.value == face){
        //         insert.loc = true
        //       }

        //       if(insert.loc && insert.nivel){
        //         issues.push(all_issues[key])
        //       }
        //     })
        //   }

        //   if(validacao == 4){
        //     let insert = {nivel : false, loc : false}
        //     issue.attributes.custom_attributes.forEach(attribute => {
        //       if(attribute.type == 'list' && attribute.id == "7b5ba1f6-2fe0-427b-a2e1-ba0fc7819b35" && attribute.value == nivelAlerta && issue.attributes.location_description == localizacao){
        //         insert.nivel = true
        //       }

        //       if(attribute.type == 'list' && attribute.id == "3ca62377-1e77-40dc-87c8-192fc008e6c6" && attribute.value == face && issue.attributes.location_description == localizacao){
        //         insert.loc = true
        //       }

        //       if(insert.loc && insert.nivel){
        //         issues.push(all_issues[key])
        //       }
        //     })
        //   }

        //   if(validacao == 5){
        //     issue.attributes.custom_attributes.forEach(attribute => {
        //       if(issue.attributes.location_description == localizacao){
        //         issues.push(all_issues[key])
        //       }
        //     })
        //   }

        //   if(validacao == 6){
        //     issue.attributes.custom_attributes.forEach(attribute => {
        //       if(attribute.type == 'list' && attribute.id == "3ca62377-1e77-40dc-87c8-192fc008e6c6" && attribute.value == face && issue.attributes.location_description == localizacao){
        //         issues.push(all_issues[key])
        //       }
        //     })
        //   }

        //   if(validacao == 7){
        //     issue.attributes.custom_attributes.forEach(attribute => {
        //       if(attribute.type == 'list' && attribute.id == "3ca62377-1e77-40dc-87c8-192fc008e6c6" && attribute.value == face){
        //         issues.push(all_issues[key])
        //       }
        //     })
        //   }

        });
      }else{
        issues = all_issues
      }
    }
  });

  return issues
}

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
