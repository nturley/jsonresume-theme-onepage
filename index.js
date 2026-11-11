var fs = require("fs");
var Handlebars = require("handlebars");

COURSES_COLUMNS = 3;

PREPEND_SUMMARY_CATEGORIES = [
  "work",
  "volunteer",
  "awards",
  "publications"
];

function validateArray(arr) {
  return arr !== undefined && arr !== null && arr instanceof Array && arr.length > 0;
}

function render(resume) {
  // Split courses into 3 columns
  if (validateArray(resume.education)) {
    resume.education.forEach(function(block) {
      if (validateArray(block.courses)) {
        splitCourses = [];
        columnIndex = 0;
        for (var i = 0; i < COURSES_COLUMNS; i++) {
          splitCourses.push([]);
        }
        block.courses.forEach(function(course) {
          splitCourses[columnIndex].push(course);
          columnIndex++;
          if (columnIndex >= COURSES_COLUMNS) {
            columnIndex = 0;
          }
        });
        block.courses = splitCourses;
      }
    });
  }

  PREPEND_SUMMARY_CATEGORIES.forEach(function(category) {
    if (resume[category] !== undefined) {
      resume[category].forEach(function(block) {
        if (block.highlights === undefined) {
          block.highlights = [];
        }
        if (block.summary) {
          block.highlights.unshift(block.summary);
          delete block.summary;
        }
      });
    }
  });

  // Group consecutive work entries at the same company into one block.
  // A group with several entries lists each position as a role line under
  // the company name, and shows the combined highlights in entry order.
  if (validateArray(resume.work)) {
    var grouped = [];
    resume.work.forEach(function(block) {
      var prev = grouped[grouped.length - 1];
      if (prev && block.company && prev.company === block.company) {
        prev.roles.push(block);
        prev.startDate = block.startDate;
        prev.highlights = prev.highlights.concat(block.highlights);
      } else {
        grouped.push({
          company: block.company,
          website: block.website,
          startDate: block.startDate,
          endDate: block.endDate,
          highlights: block.highlights.slice(),
          details: block.details,
          roles: [block]
        });
      }
    });
    grouped.forEach(function(group) {
      if (group.roles.length === 1) {
        group.position = group.roles[0].position;
        group.roles = [];
      }
    });
    resume.work = grouped;
  }

	var css = fs.readFileSync(__dirname + "/style.css", "utf-8");
	var tpl = fs.readFileSync(__dirname + "/resume.hbs", "utf-8");
	return Handlebars.compile(tpl)({
		css: css,
		resume: resume
	});
}

module.exports = {
	render: render
};
