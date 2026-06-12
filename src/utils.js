export const STORAGE_KEY = "uniplan.plan.v1";

export function uid(prefix = "item") {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function allCourses(plan) {
  return plan.modules.flatMap((module) =>
    module.courses.map((course) => ({ ...course, moduleId: module.id, moduleName: module.name }))
  );
}

export function calculateStats(plan) {
  const courses = allCourses(plan);
  const completed = courses
    .filter((course) => course.status === "completed")
    .reduce((sum, course) => sum + Number(course.credits || 0), 0);
  const planned = courses
    .filter((course) => course.status === "planned")
    .reduce((sum, course) => sum + Number(course.credits || 0), 0);
  const remaining = Math.max(Number(plan.profile.totalCredits || 0) - completed - planned, 0);

  const graded = courses.filter(
    (course) =>
      course.status === "completed" &&
      course.countsTowardGpa !== false &&
      course.grade !== "" &&
      Number.isFinite(Number(course.grade))
  );
  const gradedCredits = graded.reduce((sum, course) => sum + Number(course.credits || 0), 0);
  const weighted = graded.reduce(
    (sum, course) => sum + Number(course.grade) * Number(course.credits || 0),
    0
  );

  return {
    completed,
    planned,
    remaining,
    average: gradedCredits ? weighted / gradedCredits : null,
    percent: plan.profile.totalCredits
      ? Math.min((completed / Number(plan.profile.totalCredits)) * 100, 100)
      : 0,
  };
}

export function moduleStats(module) {
  const completed = module.courses
    .filter((course) => course.status === "completed")
    .reduce((sum, course) => sum + Number(course.credits || 0), 0);
  const planned = module.courses
    .filter((course) => course.status === "planned")
    .reduce((sum, course) => sum + Number(course.credits || 0), 0);
  return { completed, planned };
}

export function validatePlan(value) {
  if (!value || typeof value !== "object") throw new Error("Invalid plan");
  if (!value.profile || !Array.isArray(value.modules)) throw new Error("Missing plan fields");
  value.modules.forEach((module) => {
    if (!module.id || !Array.isArray(module.courses)) throw new Error("Invalid module");
  });
  return value;
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

export function planFromCsv(text, currentProfile) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV is empty");
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const required = ["module", "course", "credits"];
  if (!required.every((header) => headers.includes(header))) throw new Error("Missing CSV columns");

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
  const modules = new Map();
  rows.forEach((row) => {
    const moduleName = row.module || "Uncategorized";
    if (!modules.has(moduleName)) {
      modules.set(moduleName, {
        id: uid("module"),
        name: moduleName,
        requiredCredits: Number(row.modulerequiredcredits || 0),
        color: row.modulecolor || "#315b72",
        courses: [],
      });
    }
    modules.get(moduleName).courses.push({
      id: uid("course"),
      code: row.code || "",
      name: row.course,
      credits: Number(row.credits || 0),
      status: ["available", "planned", "completed"].includes(row.status) ? row.status : "available",
      semester: row.semester ? Number(row.semester) : null,
      grade: row.grade || "",
      countsTowardGpa: row.countstowardgpa !== "false",
      offered: ["winter", "summer", "every"].includes(row.offered) ? row.offered : "every",
      prerequisite: row.prerequisite || "",
    });
  });

  return {
    schemaVersion: 1,
    profile: { ...currentProfile },
    modules: [...modules.values()],
  };
}

export function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const CSV_TEMPLATE = `module,moduleRequiredCredits,moduleColor,code,course,credits,status,semester,grade,countsTowardGpa,offered,prerequisite
Core,120,#315b72,CS101,Introduction to Computer Science,6,planned,1,,true,winter,
Electives,45,#c87941,EL201,Example elective,5,available,,,true,every,
Thesis,15,#6c6f93,THESIS,Bachelor thesis,15,available,,,false,every,120 credits recommended`;
