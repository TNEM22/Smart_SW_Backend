const User = require('../models/user');
const Esp = require('../models/esp');
const Switch = require('../models/switch');

async function verifyUser(id) {
  try {
    await User.findById(id);
    return true;
  } catch (e) {
    return false;
  }
}

async function updateDb(data) {
  const esp = data.split(':')[0];
  const sw = data.split(':')[1].split('?')[0];
  let state = data.split(':')[1].split('?')[1];
  if (state === '1') {
    state = true;
  } else {
    state = false;
  }
  const aesp = await Esp.findById(esp);
  if (aesp.switches.includes(sw)) {
    await Switch.findByIdAndUpdate(sw, { state: state });
  }
}

module.exports = { verifyUser, updateDb };
