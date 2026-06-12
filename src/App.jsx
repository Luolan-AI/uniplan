import { useEffect, useMemo, useRef, useState } from "react";
import { createTranslator } from "./i18n";
import { blankPlan, clonePlan, templates } from "./templates";
import {
  allCourses,
  calculateStats,
  CSV_TEMPLATE,
  downloadFile,
  moduleStats,
  planFromCsv,
  STORAGE_KEY,
  uid,
  validatePlan,
} from "./utils";

const NAV_ITEMS = ["dashboard", "curriculum", "semesters", "importExport", "settings"];
const STATUS_ORDER = ["available", "planned", "completed"];

function loadPlan() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? validatePlan(JSON.parse(saved)) : clonePlan(blankPlan);
  } catch {
    return clonePlan(blankPlan);
  }
}

function Icon({ name, size = 20 }) {
  const paths = {
    dashboard: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
    curriculum: "M5 4h11a3 3 0 0 1 3 3v13H7a2 2 0 0 1-2-2V4Zm2 12.2A4 4 0 0 1 9 16h8V7a1 1 0 0 0-1-1H7v10.2ZM7 18a.5.5 0 0 0 .5.5H17V18H7.5a.5.5 0 0 0-.5.5Z",
    semesters: "M6 3v2M18 3v2M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
    importExport: "M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5L9 6a8 8 0 0 0-1.7 1L5 6.1 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5l2 3.4 2.3-1a8 8 0 0 0 1.7 1l.5 3h5l.5-3a8 8 0 0 0 1.7-1l2.3 1 2-3.4-2.1-1.5a7 7 0 0 0 .1-1Z",
    plus: "M12 5v14M5 12h14",
    edit: "m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Zm9-12 3.5 3.5",
    trash: "M5 7h14M9 7V4h6v3m2 0-1 13H8L7 7m3 4v5m4-5v5",
    lock: "M7 11V8a5 5 0 0 1 10 0v3m-11 0h12v10H6V11Z",
    file: "M6 3h8l4 4v14H6V3Zm8 0v5h5M9 13h6m-6 4h6",
    shield: "M12 3 5 6v5c0 4.6 2.9 8 7 10 4.1-2 7-5.4 7-10V6l-7-3Zm-3 9 2 2 4-4",
  };
  const lineIcons = ["semesters", "importExport", "settings", "plus", "edit", "trash", "lock", "file", "shield"];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={lineIcons.includes(name) ? "none" : "currentColor"}
      stroke={lineIcons.includes(name) ? "currentColor" : "none"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.dashboard} />
    </svg>
  );
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const close = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Progress({ completed, planned, total, color }) {
  const completedWidth = total ? Math.min((completed / total) * 100, 100) : 0;
  const plannedWidth = total ? Math.min((planned / total) * 100, 100 - completedWidth) : 0;
  return (
    <div className="progress-track" aria-label={`${completed + planned}/${total}`}>
      <span className="progress-complete" style={{ width: `${completedWidth}%`, background: color }} />
      <span className="progress-planned" style={{ width: `${plannedWidth}%`, background: color }} />
    </div>
  );
}

function StatusControl({ value, t, onChange }) {
  return (
    <div className="segmented compact">
      {STATUS_ORDER.map((status) => (
        <button
          key={status}
          type="button"
          className={value === status ? `active status-${status}` : ""}
          onClick={() => onChange(status)}
        >
          {t(status)}
        </button>
      ))}
    </div>
  );
}

function CourseForm({ draft, modules, semesterCount, t, onSave, onClose }) {
  const [form, setForm] = useState(draft);
  const field = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      ...form,
      credits: Number(form.credits || 0),
      semester: form.semester ? Number(form.semester) : null,
    });
  };

  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="span-2">
        <span>{t("courseName")}</span>
        <input autoFocus required value={form.name} onChange={(event) => field("name", event.target.value)} />
      </label>
      <label>
        <span>{t("courseCode")}</span>
        <input value={form.code} onChange={(event) => field("code", event.target.value)} />
      </label>
      <label>
        <span>{t("credits")}</span>
        <input type="number" min="0" step="0.5" required value={form.credits} onChange={(event) => field("credits", event.target.value)} />
      </label>
      <label>
        <span>{t("module")}</span>
        <select value={form.moduleId} onChange={(event) => field("moduleId", event.target.value)}>
          {modules.map((module) => <option key={module.id} value={module.id}>{module.name}</option>)}
        </select>
      </label>
      <label>
        <span>{t("status")}</span>
        <select value={form.status} onChange={(event) => field("status", event.target.value)}>
          {STATUS_ORDER.map((status) => <option key={status} value={status}>{t(status)}</option>)}
        </select>
      </label>
      <label>
        <span>{t("semester")}</span>
        <select value={form.semester || ""} onChange={(event) => field("semester", event.target.value)}>
          <option value="">{t("unassigned")}</option>
          {Array.from({ length: semesterCount }, (_, index) => index + 1).map((number) => (
            <option key={number} value={number}>{t("termLabel", { n: number })}</option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("offered")}</span>
        <select value={form.offered} onChange={(event) => field("offered", event.target.value)}>
          <option value="every">{t("everySemester")}</option>
          <option value="winter">{t("winter")}</option>
          <option value="summer">{t("summer")}</option>
        </select>
      </label>
      <label>
        <span>{t("grade")}</span>
        <input type="number" step="0.1" value={form.grade} onChange={(event) => field("grade", event.target.value)} />
      </label>
      <label className="checkbox-label">
        <input type="checkbox" checked={!form.countsTowardGpa} onChange={(event) => field("countsTowardGpa", !event.target.checked)} />
        <span>{t("passFail")}</span>
      </label>
      <label className="span-2">
        <span>{t("prerequisite")}</span>
        <textarea rows="2" value={form.prerequisite} onChange={(event) => field("prerequisite", event.target.value)} />
      </label>
      <div className="form-actions span-2">
        <button className="button ghost" type="button" onClick={onClose}>{t("cancel")}</button>
        <button className="button primary" type="submit">{t("save")}</button>
      </div>
    </form>
  );
}

function ModuleForm({ draft, t, onSave, onClose }) {
  const [form, setForm] = useState(draft);
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, requiredCredits: Number(form.requiredCredits || 0) });
  };
  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="span-2">
        <span>{t("moduleName")}</span>
        <input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      </label>
      <label>
        <span>{t("requiredCredits")}</span>
        <input type="number" min="0" step="0.5" value={form.requiredCredits} onChange={(event) => setForm({ ...form, requiredCredits: event.target.value })} />
      </label>
      <label>
        <span>{t("color")}</span>
        <input className="color-input" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
      </label>
      <div className="form-actions span-2">
        <button className="button ghost" type="button" onClick={onClose}>{t("cancel")}</button>
        <button className="button primary" type="submit">{t("save")}</button>
      </div>
    </form>
  );
}

export default function App() {
  const [plan, setPlan] = useState(loadPlan);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [courseDraft, setCourseDraft] = useState(null);
  const [moduleDraft, setModuleDraft] = useState(null);
  const [toast, setToast] = useState("");
  const fileInput = useRef(null);
  const language = plan.profile.language || "en";
  const t = useMemo(() => createTranslator(language), [language]);
  const stats = useMemo(() => calculateStats(plan), [plan]);
  const courses = useMemo(() => allCourses(plan), [plan]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    document.documentElement.lang = language;
  }, [plan, language]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateCourse = (moduleId, courseId, updates) => {
    setPlan((current) => ({
      ...current,
      modules: current.modules.map((module) =>
        module.id === moduleId
          ? { ...module, courses: module.courses.map((course) => course.id === courseId ? { ...course, ...updates } : course) }
          : module
      ),
    }));
  };

  const openNewCourse = (moduleId = plan.modules[0]?.id) => {
    if (!moduleId) {
      setModuleDraft({ id: uid("module"), name: "", requiredCredits: 0, color: "#315b72", courses: [] });
      return;
    }
    setCourseDraft({
      id: uid("course"), moduleId, code: "", name: "", credits: 5, status: "available",
      semester: null, grade: "", countsTowardGpa: true, offered: "every", prerequisite: "", isNew: true,
    });
  };

  const saveCourse = (draft) => {
    const clean = { ...draft };
    delete clean.moduleId;
    delete clean.isNew;
    setPlan((current) => {
      const withoutCourse = current.modules.map((module) => ({
        ...module,
        courses: module.courses.filter((course) => course.id !== draft.id),
      }));
      return {
        ...current,
        modules: withoutCourse.map((module) => module.id === draft.moduleId ? { ...module, courses: [...module.courses, clean] } : module),
      };
    });
    setCourseDraft(null);
  };

  const removeCourse = (moduleId, courseId) => {
    if (!window.confirm(t("confirmDelete"))) return;
    setPlan((current) => ({
      ...current,
      modules: current.modules.map((module) => module.id === moduleId ? { ...module, courses: module.courses.filter((course) => course.id !== courseId) } : module),
    }));
  };

  const saveModule = (draft) => {
    setPlan((current) => {
      const exists = current.modules.some((module) => module.id === draft.id);
      return {
        ...current,
        modules: exists
          ? current.modules.map((module) => module.id === draft.id ? draft : module)
          : [...current.modules, draft],
      };
    });
    setModuleDraft(null);
  };

  const removeModule = (moduleId) => {
    if (!window.confirm(t("confirmDelete"))) return;
    setPlan((current) => ({ ...current, modules: current.modules.filter((module) => module.id !== moduleId) }));
  };

  const setProfile = (field, value) => {
    setPlan((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
  };

  const useTemplate = (template) => {
    if (!window.confirm(t("replaceWarning"))) return;
    const next = clonePlan(template.plan);
    next.profile.language = language;
    setPlan(next);
    setActiveTab("dashboard");
  };

  const importFile = async (file) => {
    try {
      const text = await file.text();
      const next = file.name.toLowerCase().endsWith(".csv")
        ? planFromCsv(text, plan.profile)
        : validatePlan(JSON.parse(text));
      if (!window.confirm(t("replaceWarning"))) return;
      setPlan(next);
      setToast(t("importSuccess"));
      setActiveTab("dashboard");
    } catch {
      setToast(t("importError"));
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const renderDashboard = () => {
    const degreeLabel = t("degreeLine", {
      university: plan.profile.university || t("university"),
      program: plan.profile.program || t("program"),
    });
    const average = stats.average === null ? t("noGrades") : stats.average.toFixed(2);
    const coverage = stats.completed + stats.planned;
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">{plan.profile.regulation || t("progress")}</p>
            <h1>{plan.profile.name ? t("welcome", { name: plan.profile.name }) : t("welcomeFallback")}</h1>
            <p>{degreeLabel}</p>
          </div>
          <div className="hero-grade">
            <span>{t("weightedAverage")}</span>
            <strong>{average}</strong>
            <small>{t(plan.profile.gradingSystem === "us" ? "usGpa" : plan.profile.gradingSystem === "percentage" ? "percentage" : "germanGrade")}</small>
          </div>
          <div className="degree-progress">
            <div className="degree-progress-copy">
              <span>{t("progress")}</span>
              <strong>{stats.completed} / {plan.profile.totalCredits}</strong>
            </div>
            <div className="hero-progress-track">
              <span style={{ width: `${stats.percent}%` }} />
            </div>
            <div className="progress-legend">
              <span><i className="dot complete" />{t("completedCredits")}: {stats.completed}</span>
              <span><i className="dot planned" />{t("plannedCredits")}: {stats.planned}</span>
            </div>
          </div>
        </section>

        <section className="metric-grid">
          <article className="metric-card"><span>{t("completedCredits")}</span><strong>{stats.completed}</strong><small>{t("creditsShort")}</small></article>
          <article className="metric-card"><span>{t("plannedCredits")}</span><strong>{stats.planned}</strong><small>{t("creditsShort")}</small></article>
          <article className="metric-card"><span>{t("remainingCredits")}</span><strong>{stats.remaining}</strong><small>{t("creditsShort")}</small></article>
          <article className="metric-card accent"><span>{t("upcoming")}</span><p>{coverage >= plan.profile.totalCredits ? t("onTrack") : t("needsPlanning", { credits: stats.remaining })}</p></article>
        </section>

        <section>
          <div className="section-heading"><div><p className="eyebrow">{t("progress")}</p><h2>{t("modules")}</h2></div><button className="button subtle" onClick={() => setActiveTab("curriculum")}>{t("curriculum")} →</button></div>
          <div className="module-grid">
            {plan.modules.map((module) => {
              const progress = moduleStats(module);
              return (
                <article className="module-card" key={module.id}>
                  <div className="module-card-top"><i style={{ background: module.color }} /><span>{progress.completed + progress.planned} / {module.requiredCredits}</span></div>
                  <h3>{module.name}</h3>
                  <Progress completed={progress.completed} planned={progress.planned} total={module.requiredCredits} color={module.color} />
                  <div className="module-counts"><span>{progress.completed} {t("completed")}</span><span>{progress.planned} {t("planned")}</span></div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  };

  const renderCurriculum = () => {
    const query = search.trim().toLowerCase();
    const visible = courses.filter((course) =>
      (moduleFilter === "all" || course.moduleId === moduleFilter) &&
      (!query || `${course.name} ${course.code}`.toLowerCase().includes(query))
    );
    return (
      <div className="page-stack">
        <div className="page-title-row">
          <div><p className="eyebrow">{plan.profile.program}</p><h1>{t("curriculum")}</h1></div>
          <div className="button-row">
            <button className="button subtle" onClick={() => setModuleDraft({ id: uid("module"), name: "", requiredCredits: 0, color: "#315b72", courses: [] })}><Icon name="plus" size={17} />{t("addModule")}</button>
            <button className="button primary" onClick={() => openNewCourse()}><Icon name="plus" size={17} />{t("addCourse")}</button>
          </div>
        </div>
        <section className="toolbar">
          <input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchCourses")} />
          <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
            <option value="all">{t("allModules")}</option>
            {plan.modules.map((module) => <option key={module.id} value={module.id}>{module.name}</option>)}
          </select>
        </section>

        {plan.modules.map((module) => {
          const moduleCourses = visible.filter((course) => course.moduleId === module.id);
          if (!moduleCourses.length && (moduleFilter !== module.id || query)) return null;
          const progress = moduleStats(module);
          return (
            <section className="curriculum-module" key={module.id}>
              <div className="curriculum-module-head">
                <div className="module-title"><i style={{ background: module.color }} /><div><h2>{module.name}</h2><span>{progress.completed + progress.planned} / {module.requiredCredits} {t("creditsShort")}</span></div></div>
                <div className="row-actions">
                  <button className="icon-button" title={t("editModule")} onClick={() => setModuleDraft(clonePlan(module))}><Icon name="edit" size={17} /></button>
                  <button className="icon-button danger" title={t("delete")} onClick={() => removeModule(module.id)}><Icon name="trash" size={17} /></button>
                </div>
              </div>
              <Progress completed={progress.completed} planned={progress.planned} total={module.requiredCredits} color={module.color} />
              <div className="course-list">
                {moduleCourses.length ? moduleCourses.map((course) => (
                  <article className="course-row" key={course.id}>
                    <div className="course-main">
                      <div className="course-code">{course.code || "—"}</div>
                      <div><h3>{course.name}</h3><p>{course.credits} {t("creditsShort")} · {t(course.offered === "winter" ? "winter" : course.offered === "summer" ? "summer" : "everySemester")}{course.prerequisite ? ` · ${course.prerequisite}` : ""}</p></div>
                    </div>
                    <StatusControl value={course.status} t={t} onChange={(status) => updateCourse(module.id, course.id, { status })} />
                    <select className="semester-select" value={course.semester || ""} onChange={(event) => updateCourse(module.id, course.id, { semester: event.target.value ? Number(event.target.value) : null })}>
                      <option value="">{t("unassigned")}</option>
                      {Array.from({ length: plan.profile.semesterCount }, (_, index) => index + 1).map((number) => <option key={number} value={number}>{t("termLabel", { n: number })}</option>)}
                    </select>
                    <div className="grade-box">
                      <input aria-label={t("grade")} type="number" step="0.1" placeholder="—" value={course.grade} onChange={(event) => updateCourse(module.id, course.id, { grade: event.target.value })} />
                    </div>
                    <div className="row-actions">
                      <button className="icon-button" onClick={() => setCourseDraft({ ...course, moduleId: module.id })}><Icon name="edit" size={17} /></button>
                      <button className="icon-button danger" onClick={() => removeCourse(module.id, course.id)}><Icon name="trash" size={17} /></button>
                    </div>
                  </article>
                )) : <div className="empty-state"><p>{t("noCourses")}</p><button className="button subtle" onClick={() => openNewCourse(module.id)}>{t("addCourse")}</button></div>}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  const renderSemesters = () => (
    <div className="page-stack">
      <div className="page-title-row"><div><p className="eyebrow">{plan.profile.program}</p><h1>{t("semesters")}</h1></div><button className="button primary" onClick={() => openNewCourse()}><Icon name="plus" size={17} />{t("addCourse")}</button></div>
      <div className="semester-grid">
        {Array.from({ length: Number(plan.profile.semesterCount || 0) }, (_, index) => index + 1).map((number) => {
          const semesterCourses = courses.filter((course) => course.semester === number && course.status !== "available");
          const credits = semesterCourses.reduce((sum, course) => sum + Number(course.credits || 0), 0);
          const graded = semesterCourses.filter((course) => course.status === "completed" && course.grade !== "" && course.countsTowardGpa !== false);
          const gradedCredits = graded.reduce((sum, course) => sum + course.credits, 0);
          const average = gradedCredits ? graded.reduce((sum, course) => sum + Number(course.grade) * course.credits, 0) / gradedCredits : null;
          return (
            <section className="semester-card" key={number}>
              <div className="semester-card-head"><div><span>{number % 2 ? t("winter") : t("summer")}</span><h2>{t("termLabel", { n: number })}</h2></div><strong className={credits > 35 ? "load-high" : ""}>{credits} {t("creditsShort")}</strong></div>
              {average !== null && <div className="semester-average">{t("weightedAverage")}: <b>{average.toFixed(2)}</b></div>}
              <div className="semester-course-list">
                {semesterCourses.length ? semesterCourses.map((course) => (
                  <article key={course.id} className="semester-course">
                    <i style={{ background: plan.modules.find((module) => module.id === course.moduleId)?.color }} />
                    <div><h3>{course.name}</h3><p>{course.moduleName}</p></div>
                    <span>{course.credits}</span>
                    <button className={`status-pill ${course.status}`} onClick={() => updateCourse(course.moduleId, course.id, { status: course.status === "completed" ? "planned" : "completed" })}>{t(course.status)}</button>
                  </article>
                )) : <div className="empty-semester"><Icon name="semesters" size={28} /><p>{t("emptySemester")}</p></div>}
              </div>
              {credits > 35 && <p className="warning-text">{t("overload")}</p>}
            </section>
          );
        })}
      </div>
    </div>
  );

  const renderImportExport = () => (
    <div className="page-stack narrow-page">
      <div className="page-title-row"><div><p className="eyebrow">{t("localOnly")}</p><h1>{t("importExport")}</h1></div></div>
      <section className="privacy-banner"><Icon name="shield" size={28} /><div><h2>{t("privacyTitle")}</h2><p>{t("privacyText")}</p></div></section>
      <div className="import-grid">
        <section className="action-card">
          <div className="action-icon"><Icon name="file" size={25} /></div>
          <h2>{t("exportTitle")}</h2><p>{t("exportHelp")}</p>
          <button className="button primary full" onClick={() => downloadFile(`uniplan-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(plan, null, 2), "application/json")}>{t("exportJson")}</button>
        </section>
        <section className="action-card">
          <div className="action-icon warm"><Icon name="importExport" size={25} /></div>
          <h2>{t("importTitle")}</h2><p>{t("importHelp")}</p>
          <input ref={fileInput} className="visually-hidden" type="file" accept=".json,.csv,application/json,text/csv" onChange={(event) => event.target.files?.[0] && importFile(event.target.files[0])} />
          <button className="button primary full" onClick={() => fileInput.current?.click()}>{t("chooseFile")}</button>
          <button className="text-button" onClick={() => downloadFile("uniplan-template.csv", CSV_TEMPLATE, "text/csv")}>{t("csvTemplate")}</button>
          <small className="privacy-note"><Icon name="lock" size={14} />{t("filePrivacy")}</small>
        </section>
      </div>
      <section>
        <div className="section-heading"><div><p className="eyebrow">JSON</p><h2>{t("templateLibrary")}</h2></div></div>
        <div className="template-grid">
          {templates.map((template) => (
            <article className="template-card" key={template.id}>
              <div className={`template-mark ${template.id}`}><span>{template.id === "blank" ? "+" : "FAU"}</span></div>
              <div><h3>{t(template.titleKey)}</h3><p>{template.plan.profile.program}</p></div>
              <button className="button subtle" onClick={() => useTemplate(template)}>{t("useTemplate")}</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderSettings = () => (
    <div className="page-stack narrow-page">
      <div className="page-title-row"><div><p className="eyebrow">UniPlan</p><h1>{t("settings")}</h1></div></div>
      <section className="settings-card">
        <h2>{t("profile")}</h2>
        <div className="form-grid settings-form">
          <label><span>{t("studentName")}</span><input value={plan.profile.name} onChange={(event) => setProfile("name", event.target.value)} /></label>
          <label><span>{t("university")}</span><input value={plan.profile.university} onChange={(event) => setProfile("university", event.target.value)} /></label>
          <label className="span-2"><span>{t("program")}</span><input value={plan.profile.program} onChange={(event) => setProfile("program", event.target.value)} /></label>
          <label><span>{t("regulation")}</span><input value={plan.profile.regulation} onChange={(event) => setProfile("regulation", event.target.value)} /></label>
          <label><span>{t("totalCredits")}</span><input type="number" min="0" value={plan.profile.totalCredits} onChange={(event) => setProfile("totalCredits", Number(event.target.value))} /></label>
          <label><span>{t("semesterCount")}</span><input type="number" min="1" max="20" value={plan.profile.semesterCount} onChange={(event) => setProfile("semesterCount", Number(event.target.value))} /></label>
          <label><span>{t("gradingSystem")}</span><select value={plan.profile.gradingSystem} onChange={(event) => setProfile("gradingSystem", event.target.value)}><option value="german">{t("germanGrade")}</option><option value="us">{t("usGpa")}</option><option value="percentage">{t("percentage")}</option></select></label>
          <label><span>{t("language")}</span><select value={language} onChange={(event) => setProfile("language", event.target.value)}><option value="zh">中文</option><option value="en">English</option><option value="de">Deutsch</option></select></label>
        </div>
      </section>
      <section className="danger-zone"><div><h2>{t("reset")}</h2><p>{t("resetHelp")}</p></div><button className="button danger-button" onClick={() => { if (window.confirm(t("confirmDelete"))) { const next = clonePlan(blankPlan); next.profile.language = language; setPlan(next); } }}>{t("reset")}</button></section>
    </div>
  );

  const pages = { dashboard: renderDashboard, curriculum: renderCurriculum, semesters: renderSemesters, importExport: renderImportExport, settings: renderSettings };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => setActiveTab("dashboard")}>
          <span className="brand-mark"><span>U</span></span>
          <span><strong>{t("appName")}</strong><small>{t("tagline")}</small></span>
        </button>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button className={activeTab === item ? "active" : ""} key={item} onClick={() => setActiveTab(item)}><Icon name={item} size={20} /><span>{t(item)}</span></button>
          ))}
        </nav>
        <div className="sidebar-foot"><Icon name="lock" size={17} /><span>{t("localOnly")}</span></div>
      </aside>
      <main className="main-content">
        <header className="mobile-header">
          <button className="brand compact-brand" type="button" onClick={() => setActiveTab("dashboard")}><span className="brand-mark"><span>U</span></span><strong>UniPlan</strong></button>
          <select aria-label={t("language")} value={language} onChange={(event) => setProfile("language", event.target.value)}><option value="zh">中文</option><option value="en">EN</option><option value="de">DE</option></select>
        </header>
        {pages[activeTab]()}
      </main>
      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => <button className={activeTab === item ? "active" : ""} key={item} onClick={() => setActiveTab(item)}><Icon name={item} size={20} /><span>{t(item)}</span></button>)}
      </nav>

      {courseDraft && <Modal title={courseDraft.isNew ? t("addCourse") : t("editCourse")} onClose={() => setCourseDraft(null)}><CourseForm draft={courseDraft} modules={plan.modules} semesterCount={plan.profile.semesterCount} t={t} onSave={saveCourse} onClose={() => setCourseDraft(null)} /></Modal>}
      {moduleDraft && <Modal title={plan.modules.some((module) => module.id === moduleDraft.id) ? t("editModule") : t("addModule")} onClose={() => setModuleDraft(null)}><ModuleForm draft={moduleDraft} t={t} onSave={saveModule} onClose={() => setModuleDraft(null)} /></Modal>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
