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
function LinearRegressionView(element, clearButton, trainButton) {
    //Set the element to draw to
    this.root = element;
    //Set the two buttons to clear datapoint and start training
    this.clearButton = clearButton;
    this.trainButton = trainButton;
}

LinearRegressionView.prototype.init = function() {
    //Initialize a graph
}

LinearRegressionView.prototype.render = function(datapoints, m, b) {
    //Render the graph, all the points and the line mx + b
    this.renderPoints(datapoints);
    this.renderLine(m, b);
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
function LinearRegressionController(model, controller) {
    //Set model and controller
    this.model = model;
    this.controller = controller;
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