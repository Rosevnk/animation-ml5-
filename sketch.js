let video;
let detector;
let detections = {};
let idCount = 0;
let dots = {};

// ML5 COCOSSD SETUP

function preload() {

  detector = ml5.objectDetector('cocossd');
}

function gotDetections(error, results) {
  if (error) {
    console.error(error);
  }

  // Decrement timers and remove objects with expired timers
  let labels = Object.keys(detections);
  for (let label of labels) {
    let objects = detections[label];
    for (let i = objects.length - 1; i >= 0; i--) {
      let object = objects[i];
      object.timer--;  // Decrement the timer for each object
      if (object.timer <= 0) {
        objects.splice(i, 1);  // Remove the object if its timer expires
      } else {
        object.taken = false;
      }
    }
  }

  // Process each detected object
  for (let i = 0; i < results.length; i++) {
    let object = results[i];
    let label = object.label;

    if (detections[label]) {
      let existing = detections[label];
      if (existing.length == 0) {
        object.id = idCount;
        idCount++;
        existing.push(object);
        object.timer = 100;
      } else {
        // Find the object closest to the new detection
        let recordDist = Infinity;
        let closest = null;
        for (let candidate of existing) {
          let d = dist(candidate.x, candidate.y, object.x, object.y);
          if (d < recordDist && !candidate.taken) {
            recordDist = d;
            closest = candidate;
          }
        }
        if (closest) {
          // Update the object with new coordinates and dimensions
          let amt = 0.75;
          closest.x = lerp(object.x, closest.x, amt);
          closest.y = lerp(object.y, closest.y, amt);
          closest.width = lerp(object.width, closest.width, amt);
          closest.height = lerp(object.height, closest.height, amt);
          closest.taken = true;
          closest.timer = 100;
        } else {
          object.id = idCount;
          idCount++;
          existing.push(object);
          object.timer = 100;
        }
      }
    } else {
      object.id = idCount;
      idCount++;
      detections[label] = [object];
      object.timer = 30;
    }
  }

  // Run object detection again on the next frame
  detector.detect(video, gotDetections);
}





function setup() {
  createCanvas(1280, 480,);
  video = createVideo(['videos/velos.mov']);
  video.hide();
  detector.detect(video, gotDetections);
  video.loop();  // the video looping
}



function draw() {
  background(250); // Light gray background

  image(video, 0, 0, 640, 480); // Display video on the left side



  stroke(200);                                 // GRID
  strokeWeight(1);
  for (let x = 640; x < width; x += 20) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += 20) {
    line(640, y, width, y);
  }

  let scaleX = 640 / video.width;      // Scale object detection results to fit the canvas
  let scaleY = 480 / video.height;

  let labels = Object.keys(detections);
  for (let label of labels) {
    let objects = detections[label];
    for (let i = objects.length - 1; i >= 0; i--) {
      let object = objects[i];

      stroke(0, 255, 0);   // Normal box on the left
      strokeWeight(2);
      noFill();
      rect(object.x * scaleX, object.y * scaleY, object.width * scaleX, object.height * scaleY);

      // Abstract shape (on the right)
      let x = (object.x * scaleX) + 640; // Shifted to the right side
      let y = object.y * scaleY;
      let w = object.width * scaleX;
      let h = object.height * scaleY;


      let numPoints = floor(random(5, 10)); // Define numPoints for the abstract shape

      // Array to store the points of the shape
      let points = [];

      // Calculate the points of the shape once
      for (let j = 0; j < numPoints; j++) {
        let angle = (TWO_PI / numPoints) * j; // Spread points evenly
        let distortionFactor = random(0.5, 1); // Vary the stretch
        let radiusX = (w / 2) * distortionFactor + random(-15, 15);
        let radiusY = (h / 2) * distortionFactor + random(-15, 15);

        let px = x + w / 2 + cos(angle) * radiusX;
        let py = y + h / 2 + sin(angle) * radiusY;

        points.push([px, py]); // Store the point in the array
      }

      // Draw the black outline for the abstract shape
      stroke(200);
      strokeWeight(10);
      noFill();

      beginShape();
      for (let pt of points) {
        curveVertex(pt[0], pt[1]); // Use the stored points for the black outline
      }
      endShape(CLOSE);

      // Draw the white stroke on top of the black outline for the abstract shape
      stroke(250);
      strokeWeight(8);
      noFill();

      beginShape();
      for (let pt of points) {
        curveVertex(pt[0], pt[1]); // Use the same stored points for the white stroke
      }
      endShape(CLOSE);



      // Check if the detected object is one of the specified types
      if (['person'].includes(object.label)) {


        let colorArray = [color('#00FF00'), color('#b1f8f2'), color('#006BA6'), color('#FB5012')];
        let randomcolor = random(colorArray)
        let circleX = random(645, width); // Random position on the right side
        let circleY = random(height); // Random position on the canvas

        fill(randomcolor, 127); // Set the fill color with random values
        noStroke();
        ellipse(circleX, circleY, 20, 20); // Draw the circle with random size
      }
      fill(200);   // Display label and ID
      stroke(250);
      textSize(13);
      text(object.label + " " + object.id, x, y);
    }
  }
}

