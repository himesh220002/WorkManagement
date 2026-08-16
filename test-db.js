const mongoose = require('mongoose');
const { TaskNode, Cycle, Pipeline } = require('./src/models/index.js');
require('dotenv').config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const tasks = await TaskNode.countDocuments();
  const tasksNoProject = await TaskNode.countDocuments({ projectId: { $exists: false } });
  const cycles = await Cycle.countDocuments();
  const pipelines = await Pipeline.countDocuments();
  console.log(`Tasks: ${tasks}, Tasks with no project: ${tasksNoProject}, Cycles: ${cycles}, Pipelines: ${pipelines}`);
  process.exit(0);
}
check();
