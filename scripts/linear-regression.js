/* Applying the MVC model in Linear Regression chart */
function LinearRegressionModel() {
    //Set up the datapoint list (containing the x and y coordinates)
    this.datapoints = []

    //Set up the parameter in y = mx + b (m and b)
    this.m = 0;
    this.b = 0;

    //Create linear regression model

    //Start by creating the layer
    this.layers_definition = [
        { type: "input", out_sx: 1, out_sy: 1, out_depth: 1 },
        { type: "fc", num_neurons: 1 }, //No activation
        { type: "regression", num_neurons: 1 }
    ]

    //Create network
    this.network = new convnetjs.Net();
    this.network.makeLayers(this.layers_definition);

    //Create trainer
    this.trainer = new convnetjs.SGDTrainer(
        this.network,
        {
            learning_rate: 0.1,
            momentum: 0.1,
            batch_size: 10,
            l2_decay: 0.001
        }
    )
}

LinearRegressionModel.prototype.clearDatapoints = function() {
    //Clear all the datapoint from the model
    //Assigning datapoints to new empty array
    this.datapoints = [];
}

LinearRegressionModel.prototype.addDatapoint = function(datapoint) {
    //Add a datapoint to the model
    //Datapoint is an object of { x: x coordinates, y: y coordinates }
    this.datapoints.push(datapoint);
}

LinearRegressionModel.prototype.predict = function(datapoint) {
    //Predict an output for a particular input
    //datapoint is an input of shape { x: ... }
    var { x } = datapoint;
    var volX = new convnetjs.Vol(1, 1, 1, 0.0);
    volX.w[0] = x / 10;

    //Forward to get value of y
   var volY = this.network.forward(volX);
   var y = volY.w[0] * 10

   //Return an object of shape { x: ..., y: ... }
   return { x, y };
}

LinearRegressionModel.prototype.startFit = function() {
    //Start fitting the line

    //Define a training function
    var model = this;

    function train() {
        //Initialize a loss
        var loss = 0;

        //Train over all examples        
        for (var i = 0; i != model.datapoints.length; ++i) {
            //Create a volume and assign to it the value of x
            var input = new convnetjs.Vol(1, 1, 1, 0.0);
            input.w[0] = model.datapoints[i].x / 10;

            //Train based on the value of y
            //Stats holds training information, also contains the loss
            var stats = model.trainer.train(input, [model.datapoints[i].y / 10]);

            //Add loss to total loss
            loss += stats.loss;
        }

        //Call onFitIteration on the average loss
        model.onFitIteration(loss / model.datapoints.length);
    }

    //Use setInterval to train the network many loops
    setInterval(train, 100);
}

LinearRegressionModel.prototype.bindFitIteration = function(onFitIteration) {
    //Bind the on fit iteration hook
    //onTrainIteration is a function of type function(loss) where loss is the current loss of the training
    //iteration
    this.onFitIteration = onFitIteration;
}


/* The View */
function LinearRegressionView(element, clearButton, trainButton, configuration) {
    //Set the element to draw to
    this.root = element;

    //Set the two buttons to clear datapoint and start training
    this.clearButton = clearButton;
    this.trainButton = trainButton;

    //Enable buttons on start
    this.areButtonsDisabled = false;

    //Configuration object: { width: ..., height: ..., margin: ... }
    this.configuration = configuration;
}

LinearRegressionView.prototype.render = function() {
    //Render the canvas and axes
    this.renderCanvas();
    this.renderAxes();
    this.renderLine();
    this.renderScore();
}

LinearRegressionView.prototype.renderCanvas = function() {
    //Render the initial canvas layout

    //Define the height and wdith of canvas
    var margin = this.configuration.margin;
    var width = this.configuration.width;
    var height = this.configuration.height;

    //Create SVG element
    this.graph = d3.select(this.root)
        .append("svg")
            .attr("width", '100%')
            .attr("height", '100%')
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", `0 0 ${width} ${height}`)
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
    this.scaleX = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);

    this.invertScaleX = d3.scaleLinear()
        .domain([0, width])
        .range([0, 10]);

    this.scaleY = d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0])

    this.invertScaleY = d3.scaleLinear()
        .domain([height, 0])
        .range([0, 10])

    //Draw the axes
    this.graph
        .append("g")
            .attr("transform", `translate(0, ${width})`)
            .call(d3.axisBottom(this.scaleX));

    this.graph
        .append("g")
            .call(d3.axisLeft(this.scaleY));
}

LinearRegressionView.prototype.renderPoint = function(datapoint) {
    //Add a single datapoint to graph
    //datapoint is an object of shape { x: ..., y: ... }

    //Get x and y coordinate from graph
    var { x, y } = datapoint;

    //Draw datapoint
    this.graph.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5)
        .style("fill", "#000");
}   

LinearRegressionView.prototype.clearPoints = function() {
    //Clear all points from the graph
    this.graph.selectAll("circle")
        .remove()
}

LinearRegressionView.prototype.renderLine = function(firstDatapoint = { x: 0, y: 0 }, secondDatapoint = { x: 10, y: 10 }) {
    //firstDatapoint is an object of shape { x:..., y:... }
    //secondDatapoint is an object of shape { x:..., y:... }
    var x1 = firstDatapoint.x, y1 = firstDatapoint.y;
    var x2 = secondDatapoint.x, y2 = secondDatapoint.y;

    //Draw convert to coordinates
    var graphX1 = this.scaleX(x1), graphY1 = this.scaleY(y1);
    var graphX2 = this.scaleX(x2), graphY2 = this.scaleY(y2);

    //Draw the coordinates
    this.regressionLine = this.graph.append("line")
        .style("stroke", "#DDA15E")
        .style("stroke-width", 2)
        .attr("x1", graphX1)
        .attr("y1", graphY1)
        .attr("x2", graphX2)
        .attr("y2", graphY2);
}

LinearRegressionView.prototype.clearLine = function() {
    //Remove current line
    this.regressionLine.remove();
}

LinearRegressionView.prototype.renderScore = function(score = 0) {
    //Render score onto the graph
    //Score is a floating point number
    this.text = d3.select(this.root)
        .select("svg")
        .append("g");

    this.text.append("text")
            .attr("class", "score-text")
            .attr("x", 180)
            .attr("y", 25)
            .text(`Current score: ${score}`);
}

LinearRegressionView.prototype.clearScore = function() {
    //Clear the current score from graph
    this.text.remove();
}

LinearRegressionView.prototype.bindClearDatapoints = function(onClearDatapoints) {
    var view = this;

    //Bind the on clear datapoint hook
    d3.select(this.clearButton).on("click", function(event) {
        if (!view.areButtonsDisabled) {
            view.clearPoints();
            onClearDatapoints();
        }
    });
}

LinearRegressionView.prototype.bindAddDatapoint = function(onAddDatapoint) {
    var margin = this.configuration.margin;
    var view = this;

    //Bind the on add datapoint hook
    d3.select("svg").on("click", function(event) {
        //Add datapoint if the button are not disabled
        if (!view.areButtonsDisabled) {
            //event contains information of click
            //Get coordinates from event
            var coords = d3.pointer(event);
            
            //Subtract out the margin to get x and y coordinates
            var x = coords[0] - margin;
            var y = coords[1] - margin;

            //x and y can be outside the graph (g element)'s domain
            //so the coordinates need checking
            if (x >= 0 && y >= 0) {
                //Render point
                view.renderPoint({ x, y });

                //Convert to correct coordinates
                var trueX = view.invertScaleX(x);
                var trueY = view.invertScaleY(y);

                //Call hook to pass coordinates
                onAddDatapoint({
                    "x": trueX,
                    "y": trueY
                });
            }
        }
    });
}

LinearRegressionView.prototype.bindStartFit = function(onStartFit) {
    //Bind the on start fitting hook
    var view = this;

    d3.select(this.trainButton).on("click", function(event) {
        if (!view.areButtonsDisabled) {
            onStartFit();
        }
    });
}

LinearRegressionView.prototype.disableButtons = function() {
    //Set disabled button to true
    this.areButtonsDisabled = true;

    //Add disabled class to clear button and start fit button
    d3.select(this.clearButton)
        .node()
        .classList
        .add("button--disabled");

    d3.select(this.trainButton)
        .node()
        .classList
        .add("button--disabled");
}


/* The Controller */
function LinearRegressionController(model, view) {
    //Set model and controller
    this.model = model;
    this.view = view;

    //Render the view
    this.view.render();

    //Bind the model callbacks
    this.model.bindFitIteration(this.handleFit.bind(this));

    //Bind the view callbacks
    this.view.bindAddDatapoint(this.handleAddPoint.bind(this));
    this.view.bindClearDatapoints(this.handleClearPoints.bind(this));
    this.view.bindStartFit(this.handleStartFit.bind(this));
}

LinearRegressionController.prototype.handleClearPoints = function() {
    //Handle clear points button click
    //Clear all datapoints from the model
    this.model.clearDatapoints();
}

LinearRegressionController.prototype.handleAddPoint = function(datapoint) {
    //Handle add points mouse click
    //datapoint is object of shape { x: ..., y: ... }
    this.model.addDatapoint(datapoint);
}

LinearRegressionController.prototype.handleStartFit = function() {
    //Handle start fit button click
    this.model.startFit();

    //Disabled add button and start fit button
    this.view.disableButtons();
}

LinearRegressionController.prototype.handleFit = function(loss) {
    //Handle fit iteration
    
    //Create two datapoint { x1, y1 } and { x2, y2 }
    var firstDatapoint = this.model.predict({ x: 0 });
    var secondDatapoint = this.model.predict({ x: 10 });
    
    //Draw the line
    this.view.clearLine();
    this.view.renderLine(firstDatapoint, secondDatapoint);

    //Draw the score
    this.view.clearScore();
    this.view.renderScore(loss);
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
    var view = new LinearRegressionView(".graph__canvas", "#clear-points-button", "#start-fitting-button", configuration);
    var model =  new LinearRegressionModel();
    var controller = new LinearRegressionController(model, view);

    return {
        //Methods for application
    }
})();