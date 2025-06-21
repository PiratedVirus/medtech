const bcrypt = require('bcryptjs');

bcrypt.compare('caredb', '$2b$10$pRl7oDGS3VBD0mblg/tWYeIzRtgSVnM931l9OHrqXVLZ9aOr8kE12', (err, res) => {
  if (err) throw err;
  console.log(res); // true or false
});