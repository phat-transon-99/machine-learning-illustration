/* Applying the MVC model in Linear Regression chart */
function LinearRegressionModel() {
    // Set up the datapoint list (containing the x and y coordinates)
    this.datapoints = []

    //Set up the parameter in y = mx + b (m and b)
    this.m = 0;
    this.b = 0;
}

LinearRegressionModel.prototype.clearDatapoints = function() {
    // Clear all the datapoint from the model
}

LinearRegressionModel.prototype.addDatapoints = function(datapoint) {
    //Add a datapoint to the model
    //Datapoint is an object of { x: x coordinates, y: y coordinates }
}

LinearRegressionModel.prototype.startFit = function() {
    //Start fitting the line
    //Call onFitIteration somewhere in the loop
}

LinearRegressionModel.prototype.bindFitIteration = function(onFitIteration) {
    //Bind the on fit iteration hook
    //onTrainIteration is a function of type function(m, b) where m, b are updated parameters for the line
    this.onFitIteration = onFitIteration;
}


/* The View */
function LinearRegressionView(element, clearButton, trainButton, configuration) {
    //Set the element to draw to
    this.root = element;

    //Set the two buttons to clear datapoint and start training
    this.clearButton = clearButton;
    this.trainButton = trainButton;

    //Configuration object: { width: ..., height: ..., margin: ... }
    this.configuration = configuration;
}

LinearRegressionView.prototype.render = function(datapoints, m, b) {
    //Render the canvas and axes
    this.renderCanvas();
    this.renderAxes();

    //Render the graph, all the points and the line mx + b
    this.renderPoints(datapoints);
    this.renderLine(m, b);
}

LinearRegressionView.prototype.renderCanvas = function() {
    //Render the initial canvas layout

    //Define the height and wdith of canvas
    var margin = this.configuration.margin;
    var width = this.configuration.width;
    var height = this.configuration.height;

    //Create SVG element
    this.graph = d3.select(".graph__canvas")
        .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background-color", "#FFF")
        .append("g")
            .attr("transform", `translate(${margin}, ${margin})`);
}

LinearRegressionView.prototype.renderAxes = function() {
    //Render the x and y axes

    //Define the margin
    var margin = this.configuration.margin;
    var width = this.configuration.width - margin * 2;
    var height = this.configuration.height - margin * 2;

    //Create x and y scale
    var scaleX = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);

    var scaleY = d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0])

    //Draw the axes
    this.graph
        .append("g")
            .attr("transform", `translate(0, ${width})`)
            .call(d3.axisBottom(scaleX));

    this.graph
        .append("g")
            .call(d3.axisLeft(scaleY));
}

LinearRegressionView.prototype.renderPoints = function(datapoints) {
    //Render all the data points on the graph
}

LinearRegressionView.prototype.renderLine = function(m, b) {
    //Render the line y = mx + b on the graph
}

LinearRegressionView.prototype.bindClearDatapoints = function(onClearDatapoint) {
    //Bind the on clear datapoint hook
    this.onClearDatapoint = onClearDatapoint;
}

LinearRegressionView.prototype.bindAddDatapoint = function(onAddDatapoint) {
    //Bind the on add datapoint hook
    this.onAddDatapoint = onAddDatapoint;
}

LinearRegressionView.prototype.bindStartFit = function(onStartFit) {
    //Bind the on start fir hook
    this.onStartFit = onStartFit;
}


/* The Controller */
function LinearRegressionController(model, view) {
    //Set model and controller
    this.model = model;
    this.view = view;

    //Bind the model callbacks

    //Bind the view callbacks

    //Render the view
    this.view.render();
}

LinearRegressionController.prototype.handleClearPoints = function() {
    //Handle clear points button click
}

LinearRegressionController.prototype.handleAddPoint = function() {
    //Handle add points mouse click
}

LinearRegressionController.prototype.handleStartFit = function() {
    //Handle start fit button click
}

LinearRegressionController.prototype.handleFit = function() {
    //Handle fit iteration
}

//Initialize application
const configuration = {
    width: 600,
    height: 600,
    margin: 50
}
Object.freeze(configuration);

const app = (function() {
    //Create view, model and controller
    var view = new LinearRegressionView(null, null, null, configuration);
    var model =  new LinearRegressionModel();
    var controller = new LinearRegressionController(model, view);

    return {
        //Methods for application
    }
})();