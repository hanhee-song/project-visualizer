const sidebarFunctions = require('./sidebar.js');
const generateHeader = sidebarFunctions.generateHeader;
const setContentMessage = sidebarFunctions.setContentMessage;

const svg = d3.select('.svg-main');


const drawGraph = (error, graph, user, repo, subdir) => {
  generateHeader(graph, user, repo, subdir);
  setContentMessage();
  
  svg.selectAll("g").remove();
  svg.selectAll("text").remove();
  const width = Number(svg.attr("width"));
  const height = Number(svg.attr("height"));
  let highlighted = "";
  let selectedTooltip = "";
  
  const simulation = d3.forceSimulation()
  .force(
    "link", d3.forceLink()
    .distance(d => distance(d)/2)
    .strength(1)
    .id((d) => d.id)
  )
  .force("charge", d3.forceManyBody(0))
  // .force("center", d3.forceCenter(width/2, height/2))
  .force("collision", d3.forceCollide(10));
  
  
  if (error) throw error;
  const link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("marker-end", (d) => `url(#marker_${d.id})`)
      .attr("opacity", ".4");

  svg.append("svg:defs").selectAll("marker")
    .data(graph.links)
    .enter().append("svg:marker")
      .attr("id", (d) => `marker_${d.id}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .attr("fill", "#ccc")
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");
  
  
  const node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter()
    .append("circle")
      .attr("r", (d) => radius(d.loc))
      .attr("fill", (d) => color(d))
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      ).on("dblclick", highlightNodes)
      .on("mouseover", generateText)
      .on("mouseout", generateText);
  
  const text = svg.selectAll("text").filter(".label")
    .data(graph.nodes)
    .enter()
    .append("text")
    .classed("label", true)
    .text((d) => abbreviate(d.name));
  
  simulation.nodes(graph.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(graph.links);

  function ticked() {
    const boundedX = (d) => {
      return Math.max(radius(d.loc), Math.min(width - radius(d.loc) - 2, d.x));
    };
    const boundedY = (d) => {
      return Math.max(radius(d.loc), Math.min(height - radius(d.loc) - 2, d.y));
    };
    
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => getCircumferencePoint(d)[0])
      .attr("y2", (d) => getCircumferencePoint(d)[1]);
    node
      .attr("cx", (d) => {
        d.x = boundedX(d);
        return d.x;
      })
      .attr("cy", (d) => {
        d.y = boundedY(d);
        return d.y;
      });
      
    text
      .attr("x", (d) => d.x + 1 + radius(d.loc))
      .attr("y", (d) => d.y + 3);
    
    function getCircumferencePoint(d) {
      const tRadius = radius(d.target.loc);
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const gamma = Math.atan2(dy, dx);
      const tx = d.target.x - (Math.cos(gamma) * tRadius);
      const ty = d.target.y - (Math.sin(gamma) * tRadius);
      return [tx, ty];
    }
  }
  
  function pointerDistance(d) {
    const targetId = d.target;
    for (var i = 0; i < graph.nodes.length; i++) {
      if (graph.nodes[i].id === targetId) {
        return graph.nodes[i].loc;
      }
    }
  }
  
  const linkedById = {};
  for (var i = 0; i < graph.nodes.length; i++) {
    linkedById[`${i},${i}`] = 1;
  }
  graph.links.forEach(d => {
    linkedById[`${d.source.id},${d.target.id}`] = 1;
  });
  const neighboring = (a, b) => linkedById[`${a.id},${b.id}`];
  const neighboringIds = (a, b) => linkedById[`${a},${b}`];
  
  function highlightNodes(d) {
    if (!highlighted || highlighted !== d.id) {
      node.style("opacity", (o) => {
        return neighboring(o, d) || neighboring(d, o) || o.id === d.id
          ? 1 : .2;
      });
      link.style("opacity", (o) => {
        return d.id === o.source.id || d.id === o.target.id ? .7 : .14;
      });
      text.style("opacity", (o) => {
        return neighboring(o, d) || neighboring(d, o) || o.id === d.id
          ? 1 : .2;
      });
      text.text((o) => {
        return neighboring(o, d) || neighboring(d, o) || o.id === d.id
          ? unextended(o.name) : abbreviate(o.name);
      });
      highlighted = d.id;
      setContentMessage(d.content);
      generateHeader(graph, user, repo, subdir, d);
    } else {
      setContentMessage();
      generateHeader(graph, user, repo, subdir);
      node.style("opacity", 1);
      link.style("opacity", .6);
      text.style("opacity", 1);
      text.text((o) => abbreviate(o.name));
      highlighted = "";
    }
  }
  
  
  function generateText(d) {
    if (selectedTooltip !== d.id) {
      selectedTooltip = d.id;
    } else {
      selectedTooltip = "";
    }
    text.text((o) => {
      if (selectedTooltip && o.id === d.id) {
        return unextended(o.name);
      }
      if (highlighted && (neighboringIds(o.id, highlighted) ||
        neighboringIds(highlighted, o.id)) || highlighted === o.id) {
        return unextended(o.name);
      }
      if (selectedTooltip && highlighted && (neighboring(o, d) ||
        neighboring(d, o) || o.id === d.id)) {
        return unextended(o.name);
      }
      return abbreviate(o.name);
    });
  }
  
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  
  function dragended(d) {
    d.fx = null;
    d.fy = null;
  }
  
  function color(d) {
    const group = d.group;
    const colors = [
      "#9e6bba",
      "#309b55",
      "#4286f4",
      "#6a7384",
      "#844040",
      "#c49c25"
    ];
    return colors[group % 6];
  }
  
  function abbreviate(name) {
    let abb;
    abb = name.split("_").map((word) => word[0]).join("");
    if (abb.length === 1) {
      abb = name.split("-").map((word) => word[0]).join("");
    }
    return abb;
  }
  
  function unextended(name) {
    return name.split(".")[0];
  }
  
  function distance(d) {
    const offset = radius(d.target.loc) + radius(d.source.loc);
    const sourceId = d.source.id.split("_");
    const targetId = d.target.id.split("_");
    const containerless = (name) => name.split("_container").join("").split(".")[0];
    
    if (containerless(d.source.id) === containerless(d.target.id)) {
      return 50 + offset;
    } else if (sourceId[0] === targetId[0]) {
      return 105 + offset;
    }
    return 180 + offset;
  }
  
  function radius(loc) {
    return Math.sqrt(loc * 2 + 25);
  }
};

module.exports = drawGraph;
