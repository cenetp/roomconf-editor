'use strict';

let lastFpCount = 0;
let currentChain = [];
let currentSelectedNode = '';

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function(str) {
    return this.slice(0, str.length) == str;
  }
}

// create empty nodes array
let nodes = new vis.DataSet([
  // {id: 1, label: 'Node 1', title: 'I have a popup!'},
]);

// create empty edges array
let edges = new vis.DataSet([
  // {id: 2, label: 'Edge 1', from: 1, to: 2},
]);

let data = {
  nodes: nodes,
  edges: edges
}

let locales = {
  en: {
    addNode: 'Add Room',
    addEdge: 'Add Edge',
    editNode: 'Edit Room',
    editEdge: 'Edit Edge',
    addDescription: 'Click in an empty space to place a new room.',
    edgeDescription: 'Click on a room and drag the edge to another room to connect them.'
  }
}

let options = {
  manipulation: {
    enabled: true,
    initiallyActive: true,
    addNode: function(nodeData, callback) {
      nodeData.label = 'ROOM';
      nodeData.roomType = 'ROOM';
      nodeData.title = 'Double-click to edit';
      callback(nodeData);
    },
    deleteNode: function(nodeData, callback) {
      if (currentSelectedNode!=='ROOM') {
        currentChain.push('r0' + currentSelectedNode);
      } else {
        if (network.getConnectedEdges(nodeId).length > 0) {
          currentChain.push('r0' + currentSelectedNode);
        }
      }
      callback(nodeData);
    },
    addEdge: function(edgeData, callback) {
      if (edgeData.from === edgeData.to) {
        userView.print('<span class="warning">Cannot connect the room to itself.</span>');
      } else {
        edgeData.label = 'EDGE';
        edgeData.edgeType = 'EDGE';
        if (edges.get().length === 0 && nodes.get().length === 2) {
          callback(edgeData);
        } else {
          let tos = edges.get().filter(function(e) { return e.from === edgeData.from })
          .map(function(e) { return e.to })
          .map(function(to) { return to === edgeData.to });
          let froms = edges.get().filter(function(e) { return e.to === edgeData.from })
          .map(function(e) { return e.from })
          .map(function(from) { return from === edgeData.to });
          if (tos.includes(true) || froms.includes(true)) {
            userView.print('<span class="warning">Rooms are already connected.</span>');
          } else {
            callback(edgeData);
          }
        }
      }
    },
    editEdge: false
  },
  nodes: {
    shape: 'dot',
    size: 27,
    font: {
      size: 18,
      strokeWidth: 0,
      face: 'Inconsolata, monospace'
    },
    borderWidth: 2
  },
  edges: {
    width: 3,
    smooth: false,
    font: {
      size: 18,
      align: 'middle',
      background: '#ffffff',
      strokeWidth: 0,
      face: 'Inconsolata, monospace'
    }
  },
  locale: 'en',
  locales: locales,
  interaction: {
    dragView: true,
    zoomView: false,
    tooltipDelay: 0,
    multiselect: true
  }
}

// create vis network
let container = document.querySelector('#metiscbr-graphui');
let network = new vis.Network(container, data, options);
network.setOptions({
  physics: {enabled: false}
});

// display the concept attributes dialog
let overlay = document.querySelector('#overlay');
let selectType = document.querySelector('.selectType');
const showOverlay = function(cls1, cls2) {
  overlay.classList.remove(cls1);
  overlay.classList.add(cls2);
  selectType.classList.remove(cls1);
  selectType.classList.add(cls2);
}
const hideWithSelected = function(selector) {
  document.querySelectorAll(selector).forEach(function(el) {
    el.classList.remove('show');
    el.classList.add('hide');
    el.classList.remove('type-selected');
  });
}
const showTypes = function(order, type, concept) {
  if (order === 'show') {
    showOverlay('hide', 'show');
    document.querySelectorAll('.' + type).forEach(function(el) {
      el.classList.remove('hide');
      el.classList.add('show');
      if (el.innerHTML === concept['roomType'] || el.innerHTML === concept['edgeType']) {
        el.classList.add('type-selected');
      } else {
        el.classList.remove('type-selected');
      }
    });
    if (type === 'room-type') {
      selectType.classList.remove('edge-overlay');
      document.querySelector('#areaInput').value = concept['area'];
      document.querySelector('#windowsInput').checked = concept['windowsExist'];
      let label = concept['label'];
      document.querySelector('#roomLabelText').value =
      label.indexOf('"') > -1 ? label.substring(label.indexOf('"')+1, label.length-1) : '';
    } else {
      selectType.classList.add('edge-overlay');
    }
  } else if (order === 'hide') {
    showOverlay('show', 'hide');
    if (type !== undefined) {
      hideWithSelected('.' + type);
    } else {
      hideWithSelected('.room-type, .edge-type');
    }
  }
}
document.querySelector('#closeTypes').onclick = function() {
  showTypes('hide');
}

let roomColors = {
  'ROOM': '#96c2fc',
  'LIVING': '#e9f1b5',
  'SLEEPING': '#cef1b5',
  'WORKING': '#f1e5b5',
  'KITCHEN': '#dbb5f1',
  'CORRIDOR': '#f1b5d5',
  'BATH': '#b5ebf1',
  'TOILET': '#b7b5f1',
  'PARKING': '#b5f1d1',
  'CHILDREN': '#aad2e6',
  'EXTERIOR': '#b5f1d1',
  'STORAGE': '#f1c4b5',
  'BUILDINGSERVICES': '#b5f1d1'
}

let nodeId = '';
let edgeId = '';
document.querySelector('.saveType').onclick = function() {
  let type = document.querySelectorAll('.type-selected')[0].innerHTML;
  if (document.querySelectorAll('.room-type')[0].classList.contains('show')) {
    let a = document.querySelector('#areaInput').value;
    let w = document.querySelector('#windowsInput').checked;
    let l = document.querySelector('#roomLabelText').value;
    let currentType = nodes.get(nodeId).label;
    if (currentType==='ROOM') {
      currentChain.push('a0' + type);
    } else {
      currentChain.push('t0' + currentType); // TODO: + ':(' + type + ')');
    }
    currentSelectedNode = type;
    nodes.update({
      id: nodeId,
      label: (l === undefined || l === '') ? type : (type + '\n"' + l.trim() + '"'),
      roomType: type,
      color: roomColors[type],
      area: a,
      windowsExist: w,
      title: 'Area: ' + ((a === undefined || a === '') ? 'undefined' : (a + ' m<sup>2</sup>')) + '<br>Windows exist: ' + w
    });
    showTypes('hide', 'room-type');
  } else if (document.querySelectorAll('.edge-type')[0].classList.contains('show')) {
    edges.update({
      id: edgeId,
      label: type,
      edgeType: type
    });
    showTypes('hide', 'edge-type');
  }
}

let types = document.querySelectorAll('.type');
types.forEach(function(t) {
  t.onclick = function() {
    types.forEach(function(tp) {
      tp.classList.remove('type-selected');
    });
    t.classList.add('type-selected');
  }
});
network.on("doubleClick", function(params) {
  let n = params.nodes;
  let e = params.edges;
  if (n.length === 1) {
    nodeId = n[0];
    showTypes('show', 'room-type', nodes.get(nodeId));
  } else if (e.length === 1) {
    edgeId = e[0];
    showTypes('show', 'edge-type', edges.get(edgeId));
  }
});
network.on("selectNode", function (params) {
  nodeId = params.nodes[0];
  currentSelectedNode = nodes.get(nodeId).roomType;
});
network.on("deselectNode", function (params) {
  currentSelectedNode = '';
  nodeId = '';
});


const renderResponse = function(el, parentEl, msg) {
  document.querySelector(parentEl).innerHTML = '';
  let element = document.createElement(el);
  element.innerHTML = msg;
  document.querySelector(parentEl).appendChild(element);
}

let userView = {
  print: function(msg) {
    if (msg.startsWith('<suggestion>')) {
      showSuggestion(msg);
    } else if(msg.startsWith('<adaptation>')) {
      drawAdaptation(msg);
    } else if (msg.startsWith('<span class="connection')) {
      // display connection message
      document.querySelector('#connMessages p').innerHTML = msg;
    } else {
      // display retrieval results or error message
      showRetrievalResults(msg);
    }
  }
}

let server = config.server;
if (typeof config.port === 'number') {
  server += ':' + config.port;
}

let req = {
  socket: null,
  connect: function(host) {
    if ('WebSocket'in window) {
      req.socket = new WebSocket(host);
    } else if ('MozWebSocket'in window) {
      req.socket = new MozWebSocket(host);
    } else {
      userView.print('<span class="connection red">'
      + 'Your browser doesn\'t support websocket connections.</span>');
      return;
    }
    req.socket.onopen = function() {
      userView.print('<span class="connection green">'
      + '&#9679;</span> Connected via websocket to <b>' + server + '</b>');
      jQuery('#send2, #getAdaptation, #getSuggestion').prop('disabled', false)
      .removeClass('disabled');
    }
    req.socket.onclose = function() {
      userView.print('<span class="connection red">'
      + '&#9679;</span> Not connected.');
      jQuery('#send2, #getAdaptation, #getSuggestion').prop('disabled', true)
      .addClass('disabled');
    }
    req.socket.onmessage = function(msg) {
      userView.print(msg.data);
    }
  },
  init: function() {
    if (window.location.protocol === 'http:' || window.location.protocol === 'file:') {
      req.connect('ws://' + server + '/request');
    } else {
      req.connect('wss://' + server + '/request');
    }
  }
}

let start = '<?xml version="1.0" encoding="UTF-8"?><searchrequest>'
let head = '<agraphml><graphml xmlns="http://graphml.graphdrawing.org/xmlns" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemalocation="http://graphml.graphdrawing.org/xmlns     http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd"><graph id="searchGraph1" edgedefault="undirected"><key id="imageUri" for="graph" attr.name="imageUri" attr.type="string"></key><key id="imageMD5" for="graph" attr.name="imageMD5" attr.type="string"></key><key id="validatedManually" for="graph" attr.name="validatedManually" attr.type="boolean"></key><key id="floorLevel" for="graph" attr.name="floorLevel" attr.type="float"></key><key id="buildingId" for="graph" attr.name="buildingId" attr.type="string"></key><key id="ifcUri" for="graph" attr.name="ifcUri" attr.type="string"></key><key id="bimServerPoid" for="graph" attr.name="bimServerPoid" attr.type="long"></key><key id="alignmentNorth" for="graph" attr.name="alignmentNorth" attr.type="float"></key><key id="geoReference" for="graph" attr.name="geoReference" attr.type="string"></key><key id="name" for="node" attr.name="name" attr.type="string"></key><key id="roomType" for="node" attr.name="roomType" attr.type="string"></key><key id="center" for="node" attr.name="center" attr.type="string"></key><key id="corners" for="node" attr.name="corners" attr.type="string"></key><key id="windowExist" for="node" attr.name="windowExist" attr.type="boolean"></key><key id="enclosedRoom" for="node" attr.name="enclosedRoom" attr.type="boolean"></key><key id="area" for="node" attr.name="area" attr.type="float"></key><key id="sourceConnector" for="edge" attr.name="sourceConnector" attr.type="string"></key><key id="targetConnector" for="edge" attr.name="targetConnector" attr.type="string"></key><key id="hinge" for="edge" attr.name="hinge" attr.type="string"></key><key id="edgeType" for="edge" attr.name="edgeType" attr.type="string"></key><data key="imageUri"></data><data key="imageMD5"></data><data key="validatedManually">false</data><data key="floorLevel">0.0</data><data key="buildingId">0</data><data key="ifcUri"></data><data key="bimServerPoid">0</data><data key="alignmentNorth">0.0</data><data key="geoReference">null</data>';
let foot = '</graph></graphml></agraphml>';
let end = '</searchrequest>';

const getNodesAndEdges = function() {
  let queryElements = '';
  let positions = network.getPositions();
  nodes.get().forEach(function(node) {
    let nodeId = node['id'];
    let roomType = node['roomType'];
    let area = (node['area'] === undefined || node['area'] === '') ? 0 : node['area'];
    let windowsExist = node['windowsExist'] === undefined ?
      false : node['windowsExist'];
    let center = '('  + positions[nodeId].x + ' ' + positions[nodeId].y + ')';
    queryElements += '<node id="' + nodeId + '">'
      + '<data key="roomType">' + roomType + '</data>'
      + '<data key="area">' + area + '</data>'
      + '<data key="windowExist">' + windowsExist + '</data>'
      + '<data key="center">' + center + '</data>'
      + '</node>';
  });
  edges.get().forEach(function(edge) {
    let edgeId = edge['id'];
    let source = edge['from'];
    let target = edge['to'];
    let edgeType = edge['edgeType'];
    queryElements += '<edge id="' + edgeId
      + '" source="' + source
      + '" target="' + target + '">'
      + '<data key="edgeType">' + edgeType + '</data>'
      + '</edge>';
  });
  return queryElements;
}

const getGraphML = function() {
  let msg2 = start + head + getNodesAndEdges() + foot;
  let filters = document.querySelectorAll('.filterCheckbox');
  let weights = document.querySelectorAll('.weightValue');
  for (let i = 0; i < filters.length; i++) {
    if (filters[i].checked === true) {
      if (weights[i].value !== '') {
        let wt = parseFloat(weights[i].value);
        msg2 = msg2
        + '<fingerprint name="' + filters[i].value
        + '" weight="' + weights[i].value + '"></fingerprint>';
      } else {
        msg2 = msg2 + '<fingerprint name="' + filters[i].value
        + '" weight="1"></fingerprint>';
      }
    }
  }
  return msg2 + end;
}

const sendQuery = function(ev) {
  // Clear retrieval messasges field first
  renderResponse('form', '#retrievalMessages', '');
  let filters = jQuery('.filterCheckbox');
  let count = filters.filter(function(index) {
    return jQuery(filters[index]).prop('checked');
  }).length;
  if (getNodesAndEdges() != '') {
    let msg2 = getGraphML();
    if (ev === 'download') {
      document.querySelector('#showAgraphml').value =
      msg2.substring(msg2.indexOf('<graphml'), msg2.lastIndexOf('</graphml') + 10);
    } else if (count < 2) {
      userView.print('<error>Please select a minimum of 2 Fingerprints.</error>');
    } else {
      lastFpCount = count;
      jQuery('#send2').prop("disabled", true).addClass('disabled');
      document.querySelector('#sendAgraphml .loading').classList.remove('ready');
      document.querySelector('#sendAgraphml .loading').classList.remove('error');
      document.querySelector('#sendAgraphml .loading').classList.add('active');
      req.socket.send(msg2);
    }
  } else {
    if (ev !== 'download') {
      userView.print('<error>Query is empty.</error>');
    }
  }
}

const getSuggestion = function() {
  let roomCount = nodes.get().length;
  if (roomCount < 2) {
    userView.print('<suggestion><error>At least two rooms should be '
    + 'available to produce a suggestion.</error></suggestion>');
  } else {
    userView.print('<suggestion></suggestion>'); // Clear suggestion field
    let edgeCount = edges.get().length;
    let actionCount = currentChain.length;
    let nodeIds = nodes.get().map(function(n) { return n.id });
    let roomsAndEdges = [];
    nodeIds.forEach(function(id) {
      let e = network.getConnectedEdges(id)
      .map(function(id) { return edges.get(id).label });
      roomsAndEdges.push(
        nodes.get(id).label + '-' + e.join('/')
      );
    });
    let chainMetaMsg = '<chainMeta>' + currentChain.join(';') + ','
    + roomCount + ',' + edgeCount + ',' + actionCount + ',' + lastFpCount + ','
    + roomsAndEdges.join('_') + '</chainMeta>';
    let suggestionMsg = (head + getNodesAndEdges() + foot)
    .replace('<agraphml>', '<suggestion>')
    .replace('</agraphml>', '</suggestion>');
    document.querySelector('#suggestion .loading').classList.remove('ready');
    document.querySelector('#suggestion .loading').classList.remove('error');
    document.querySelector('#suggestion .loading').classList.add('active');
    jQuery('#getSuggestion').prop("disabled", true).addClass('disabled');
    req.socket.send(chainMetaMsg + suggestionMsg);
  }
}

const getAdaptation = function() {
  userView.print('<adaptation></adaptation>'); // Clear suggestion field
  if (getNodesAndEdges() != '') {
    let adaptationMsg = (head + getNodesAndEdges() + foot)
    .replace('<agraphml>', '<adaptation>')
    .replace('</agraphml>', '</adaptation>');
    document.querySelector('#adaptation .loading').classList.remove('error');
    document.querySelector('#adaptation .loading').classList.add('active');
    jQuery('#getAdaptation').prop("disabled", true).addClass('disabled');
    req.socket.send(adaptationMsg);
  } else {
    userView.print('<adaptation><error>Room configuration is empty.</error></adaptation>');
  }
}

let cl = document.querySelector('#showAgraphml').classList;
let cl_ag = document.querySelector('#agraphmlControls').classList;

document.querySelector('#downloadAgraphml').onclick = function() {
  if (cl.contains('hide')) {
    cl.remove('hide');
    cl_ag.remove('hide');
    cl.add('show');
    cl_ag.add('show');
    sendQuery('download');
  } else {
    cl.remove('show');
    cl_ag.remove('show');
    cl.add('hide');
    cl_ag.add('hide');
  }
}

const applyAgraphml = function(agraphml, nodesToUpdate, edgesToUpdate, networkToUpdate) {
  // first clear existing nodes and edges
  nodesToUpdate.clear();
  edgesToUpdate.clear();
  // parse AGraphML
  let doc = jQuery.parseXML(agraphml);
  let xml = jQuery(doc);
  let agraphmlNodes = xml.find('node');
  let agraphmlEdges = xml.find('edge');
  agraphmlNodes.each(function() {
    let roomId = jQuery(this).attr('id');
    let roomType = '';
    let center = {};
    let area = '';
    let windowsExist = '';
    let replacementText = '';
    let data = jQuery(this).find('data');
    data.each(function() {
      let key = jQuery(this).attr('key');
      let text = jQuery(this).first().text();
      if (key === 'roomType') {
        roomType = text.toUpperCase();
      }
      if (key === 'center') {
        let xy = text.substring(text.indexOf('(')+1, text.indexOf(')')).split(' ');
        center.x = parseFloat(xy[0]);
        center.y = parseFloat(xy[1]);
      }
      if (key === 'area') {
        area = 'Area: ' + text + ' m<sup>2</sup><br>';
      }
      if (key === 'windowExist') {
        windowsExist = 'Windows exist: ' + text;
      }
    });
    let replacement = jQuery(this).find('replacement');
    replacement.each(function() {
      let text = jQuery(this).first().text();
      replacementText = '<b>Replaces: </b><i>' + text + '</i><br>';
    });
    if (area === '') {
      area = 'Area: undefined<br>';
    }
    if (windowsExist === '') {
      windowsExist = 'Windows exist: undefined';
    }
    if (roomId !== undefined && roomId !== '' && roomType !== undefined && roomType != '') {
      let newNode = {
        id: roomId,
        label: roomType,
        roomType: roomType,
        x: center.x,
        y: center.y,
        color: roomColors[roomType],
        title: replacementText + area + windowsExist,
        borderWidth: replacementText !== '' ? 5 : 2,
        shapeProperties: {
          borderDashes: replacementText !== '' ? true : false
        }
      }
      nodesToUpdate.update(newNode)
    }
  });
  agraphmlEdges.each(function() {
    let edgeId = jQuery(this).attr('id');
    let source = jQuery(this).attr('source');
    let target = jQuery(this).attr('target');
    let edgeType = ''
    let data = jQuery(this).find('data');
    data.each(function() {
      let key = jQuery(this).attr('key');
      if (key === 'edgeType') {
        edgeType = (jQuery(this).first().text()).toUpperCase();
      }
    });
    let idAvailable = (edgeId !== undefined && edgeId !== '');
    let sourceAvailable = (source !== undefined && source !== '');
    let targetAvailable = (target !== undefined && target !== '');
    let typeAvailable = (edgeType !== undefined && edgeType !== '');
    if (idAvailable && sourceAvailable && targetAvailable && typeAvailable) {
      let newEdge = {
        id: edgeId,
        from: source,
        to: target,
        edgeType: edgeType,
        label: edgeType
      }
      edgesToUpdate.update(newEdge);
    }
  });
  // update vis network data
  networkToUpdate.setData({nodes: nodesToUpdate, edges: edgesToUpdate});
}

document.querySelector('#applyAgraphml').onclick = function() {
  let agraphmlText = document.querySelector('#showAgraphml').value;
  applyAgraphml(agraphmlText, nodes, edges, network);
  cl.remove('show');
  cl_ag.remove('show');
  cl.add('hide');
  cl_ag.add('hide');
}

const agraphmlToRoomConf = function() {
  let results = jQuery('#result tr');
  results.each(function(result) {
    let visualResultsContainer = jQuery(results[result]).children().get(4);
    let resultAgraphmlContainer = jQuery(visualResultsContainer).children().get(0);
    let resultAgraphmlElement = jQuery(resultAgraphmlContainer);
    let resultAgraphml = resultAgraphmlElement.html();
    if (resultAgraphml.startsWith('<graphml')) {
      let resultId = 'resultAgraphml_' + result;
      resultAgraphmlElement.prop('id', resultId);
      let resultNodes = new vis.DataSet([]);
      let resultEdges = new vis.DataSet([]);
      let resultData = {
        nodes: resultNodes,
        edges: resultEdges
      }
      let resultContainer = document.querySelector('#' + resultId);
      let resultNetwork = new vis.Network(resultContainer, {}, options);
      resultNetwork.setOptions({
        height: '180px',
        physics: {
          enabled: false
        },
        interaction: {
          hover: false,
          dragNodes: false,
          dragView: false,
          selectable: false
        }
      });
      applyAgraphml(resultAgraphml, resultNodes, resultEdges, resultNetwork);
      jQuery('#' + resultId + ' .vis-manipulation').hide();
    }
    jQuery(visualResultsContainer).show();
  });
}

const showRetrievalResults = function(msg) {
  let loading = document.querySelector('#sendAgraphml .loading');
  loading.classList.remove('active');
  if (msg.indexOf('error') > -1) {
    loading.classList.add('error');
    renderResponse('form', '#retrievalMessages', msg);
    jQuery('#send2').prop("disabled", false).removeClass('disabled');
  } else if (msg.startsWith('<result>') || msg.startsWith('<?xml')) {
    document.querySelector('#output').classList.remove('hide');
    document.querySelector('#output').classList.add('show');
    loading.classList.add('ready');
    let resultCount = (msg.match(/<\/tr>/g)).length;
    document.querySelector('#resultCount').innerHTML = resultCount;
    jQuery('#result').css('width', (resultCount * 250) + 'px');
    renderResponse('tbody', '#result', msg);
    agraphmlToRoomConf();
    jQuery('tr').append('<td class="showExplanation">Explain</td>');
  }
}

let closeOutput = document.querySelector('#closeOutput');
closeOutput.onclick = function() {
  document.querySelector('#output').classList.remove('show');
  document.querySelector('#output').classList.add('hide');
  jQuery('#send2').prop("disabled", false).removeClass('disabled');
  let loading = document.querySelector('#sendAgraphml .loading');
  loading.classList.remove('ready');
}

const showSuggestion = function(msg) {
  let loading = document.querySelector('#suggestion .loading');
  loading.classList.remove('active');
  renderResponse('div', '#suggestions', msg);
  if (msg.indexOf('error') > -1) {
    loading.classList.add('error');
    jQuery('#getSuggestion').prop("disabled", false).removeClass('disabled');
  } else {
    loading.classList.add('ready');
  }
  if (msg.indexOf('from') > -1) {
    let from = jQuery('from').text();
    let nodeFrom = nodes.get(from);
    // Re-adding x and y is necessary for node to appear at the same position
    let xFrom = nodeFrom.x;
    let yFrom = nodeFrom.y;
    nodeFrom.x = xFrom;
    nodeFrom.y = yFrom;
    nodeFrom.borderWidth = 6;
    nodeFrom.borderWidthSelected = 6;
    nodes.update(nodeFrom);
    jQuery('room1').css('background', nodeFrom.color);
    let to = jQuery('to').text();
    if (to !== '') {
      let nodeTo = nodes.get(to);
      let xTo = nodeTo.x;
      let yTo = nodeTo.y;
      nodeTo.x = xTo;
      nodeTo.y = yTo;
      nodeTo.borderWidth = 6;
      nodeTo.borderWidthSelected = 6;
      nodes.update(nodeTo);
      jQuery('room2').css('background', nodeTo.color);
    }
    let action = jQuery('action').text();
    if (action === 'add') {
      let roomType = jQuery('roomType').text();
      let uuid = jQuery('uuidRoom').text();
      let newNode = {
        id: uuid,
        label: roomType,
        color: roomColors[roomType]
      }
      nodes.update(newNode);
      let uuidEdge1 = jQuery('uuidEdge1').text();
      let newEdge1 = {
        id: uuidEdge1,
        label: 'EDGE',
        from: uuid,
        to: from
      }
      edges.update(newEdge1);
      if (to !== '') {
        let uuidEdge2 = jQuery('uuidEdge2').text();
        let newEdge2 = {
          id: uuidEdge2,
          label: 'EDGE',
          from: uuid,
          to: to
        }
        edges.update(newEdge2);
      }
    }
  }
}

const resetSuggestion = function() {
  jQuery('#suggestions').children().remove();
  jQuery('#getSuggestion').prop("disabled", false).removeClass('disabled');
  jQuery('#suggestion .loading').removeClass('ready');
}

const addReplacements = function(adaptation) {
  let doc = jQuery.parseXML(adaptation);
  let xml = jQuery(doc);
  let replacements = xml.find('replacement');
  if (replacements.length > 0) {
    replacements.each(function(index) {
      let replacement = replacements[index];
      let oldRoom = jQuery(replacement).find('old').text();
      let newRoom = jQuery(replacement).find('new').text();
      try {
        let oldNode = nodes.get(oldRoom);
        let oldLabel = oldNode.label;
        xml.find('node#' + newRoom).append('<replacement>'
        + oldLabel.replace('\n', ' ') + '</replacement>');
      } catch (e) {
        userView.print('<adaptation>Some adaptations might be displayed '
        + 'incompletely.</adaptation>');
      }
    });
  }
  return xml.find('graphml').html();
}

let currentConfigAndAdaptations = [];
let closeAdaptation = document.querySelector('#closeAdaptation');

const drawAdaptation = function(msg) {
  let loading = document.querySelector('#adaptation .loading');
  loading.classList.remove('active');
  let agraphml = msg.substring(12, msg.lastIndexOf('</adaptation>'));
  if (agraphml.startsWith('<agraphml')) {
    loading.classList.add('ready');
    let currentConfig = (head + getNodesAndEdges() + foot);
    let adaptationsAndReplacements = agraphml.split(';');
    let adaptations = [];
    adaptationsAndReplacements.forEach(function(adaptationAndReplacement) {
      adaptations.push(addReplacements(adaptationAndReplacement));
    });
    adaptations.unshift(currentConfig);
    currentConfigAndAdaptations = adaptations;
    for (let i = 0; i < adaptations.length; i++) {
      let adaptation = i == 0 ? 'Original' : ('Adaptation ' + i);
      jQuery('#adaptations').append(
        '<input type="radio" name="adaptations" value="'
        + i + '" id="adaptation_' + i + '"><label for="adaptation_'
        + i + '">' + adaptation  + '</label><br>'
      );
    }
    closeAdaptation.classList.remove('hide');
    closeAdaptation.classList.add('show');
  } else {
    loading.classList.add('error');
    renderResponse('div', '#adaptations', msg);
  }
}

closeAdaptation.onclick = function() {
  document.querySelector('#adaptation .loading').classList.remove('ready');
  document.querySelector('#adaptation .loading').classList.remove('error');
  closeAdaptation.classList.remove('show');
  closeAdaptation.classList.add('hide');
  jQuery('#adaptations').children().remove();
  jQuery('#getAdaptation').prop("disabled", false).removeClass('disabled');
}

const initApp = function() {
  // read the config
  if (!config.retrieval) {
    document.querySelector('#sendAgraphml').classList.add('hide');
    document.querySelector('#output').classList.add('hide');
  }
  if (!config.suggestion) {
    document.querySelector('#suggestion').classList.add('hide');
  }
  if (!config.adaptation) {
    document.querySelector('#adaptation').classList.add('hide');
  }
  // add click events
  document.querySelector('#send2').onclick = sendQuery;
  document.querySelector('#getSuggestion').onclick = getSuggestion;
  document.querySelector('#getAdaptation').onclick = getAdaptation;
  // Initialize WebSocket
  if (config.retrieval || config.suggestion || config.adaptation) {
    req.init();
  }
}

const ready = function(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(initApp);

jQuery(function($) {
  $('#result, #suggestion').on('click', 'button', function() {
    $(this).siblings('p, ol').slideToggle(200);
  });
  $('#result, #suggestion').on('click', 'button.see-more', function() {
    $(this).parent().parent()
      .siblings('.show-justification, .show-contexts, .show-stats')
      .slideToggle(200);
  });
  $('.vis-close').remove();
  $('body').on('change', '#adaptations input', function() {
    let adaptationIndex = parseInt($(this).val());
    let selectedAdaptation = currentConfigAndAdaptations[adaptationIndex];
    applyAgraphml(selectedAdaptation, nodes, edges, network);
  });
  $('body').on('click', '#accept', function() {
    resetSuggestion();
  });
  $('body').on('click', '#deny', function() {
    let uuid = $('uuidRoom').text();
    nodes.remove(uuid);
    resetSuggestion();
  });
  $('body').on('click', '.showExplanation', function() {
    let tr = $(this).parent();
    let tdFirst = tr.children('td').first();
    tdFirst.show();
    if (!tdFirst.hasClass('explanation')) {
      tdFirst.addClass('explanation');
      tr.append('<div class="closeExplanation">&times;</div>');
    } else {
      tr.children('.closeExplanation').show();
    }
  });
  $('body').on('click', '.closeExplanation', function() {
    $(this).siblings('.explanation').hide();
    $(this).hide();
  });
  $('.navigate.right').on('click', function() {
    let scroll = jQuery('#outputResults').scrollLeft();
    jQuery('#outputResults').scrollLeft(scroll + 50);
  });
  $('.navigate.left').on('click', function() {
    let scroll = jQuery('#outputResults').scrollLeft();
    jQuery('#outputResults').scrollLeft(scroll - 50);
  });
});
