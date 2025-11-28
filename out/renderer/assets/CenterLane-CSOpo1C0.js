import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, D as Dices } from "./index-ChM8alZf.js";
import { u as useWeaveStore, a as useTableStore, b as useTabStore, P as Plus, T as Trash2, r as recalculateRanges, c as rollWeave, l as logWeaveResult, g as generateRowId } from "./weaveResult-DLyoUq4r.js";
const __iconNode$1 = [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
];
const Save = createLucideIcon("save", __iconNode$1);
const __iconNode = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
];
const X = createLucideIcon("x", __iconNode);
function WeaveEditor({ weaveId }) {
  const { registry: weaveRegistry, updateWeave, saveWeave } = useWeaveStore();
  const { registry: tableRegistry } = useTableStore();
  const updateTabTitle = useTabStore((state) => state.updateTabTitle);
  const weave = weaveRegistry?.weaves.get(weaveId);
  const [localWeave, setLocalWeave] = reactExports.useState(weave || null);
  const [isSaving, setIsSaving] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (weave) {
      setLocalWeave(weave);
    }
  }, [weave]);
  if (!localWeave) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-slate-500", children: "Weave not found" }) });
  }
  const handleNameChange = (name) => {
    const updated = { ...localWeave, name };
    setLocalWeave(updated);
    updateTabTitle(weaveId, name);
  };
  const handleAuthorChange = (author) => {
    setLocalWeave({ ...localWeave, author });
  };
  const handleMaxRollChange = (maxRoll) => {
    const updated = {
      ...localWeave,
      maxRoll,
      rows: recalculateRanges(localWeave.rows, maxRoll)
    };
    setLocalWeave(updated);
  };
  const handleRowTypeChange = (rowId, targetType) => {
    const updatedRows = localWeave.rows.map(
      (row) => row.id === rowId ? { ...row, targetType, targetId: "" } : row
    );
    setLocalWeave({ ...localWeave, rows: updatedRows });
  };
  const handleRowTargetChange = (rowId, targetId) => {
    const updatedRows = localWeave.rows.map(
      (row) => row.id === rowId ? { ...row, targetId } : row
    );
    setLocalWeave({ ...localWeave, rows: updatedRows });
  };
  const handleAddRow = () => {
    const newRow = {
      id: generateRowId(),
      from: 0,
      to: 0,
      targetType: "aspect",
      targetId: ""
    };
    const updatedRows = recalculateRanges([...localWeave.rows, newRow], localWeave.maxRoll);
    setLocalWeave({ ...localWeave, rows: updatedRows });
  };
  const handleRemoveRow = (rowId) => {
    const updatedRows = localWeave.rows.filter((row) => row.id !== rowId);
    const recalculated = recalculateRanges(updatedRows, localWeave.maxRoll);
    setLocalWeave({ ...localWeave, rows: recalculated });
  };
  const handleRowRangeChange = (rowId, field, value) => {
    const updatedRows = localWeave.rows.map(
      (row) => row.id === rowId ? { ...row, [field]: value } : row
    );
    setLocalWeave({ ...localWeave, rows: updatedRows });
  };
  const handleRoll = () => {
    try {
      const { roll, row } = rollWeave(localWeave);
      logWeaveResult(localWeave, roll, row);
    } catch (error) {
      console.error("Failed to roll weave:", error);
      alert(error instanceof Error ? error.message : "Failed to roll weave");
    }
  };
  const handleSave = async () => {
    if (localWeave.rows.length === 0) {
      alert("Weave must have at least one row");
      return;
    }
    if (localWeave.maxRoll < localWeave.rows.length) {
      alert("Max roll must be at least equal to the number of rows");
      return;
    }
    const emptyTargets = localWeave.rows.filter((row) => !row.targetId);
    if (emptyTargets.length > 0) {
      alert("All rows must have a target selected");
      return;
    }
    setIsSaving(true);
    try {
      updateWeave(localWeave);
      await saveWeave(weaveId);
    } catch (error) {
      console.error("Failed to save weave:", error);
      alert("Failed to save weave");
    } finally {
      setIsSaving(false);
    }
  };
  const getTargetOptions = (targetType) => {
    if (!tableRegistry) return [];
    switch (targetType) {
      case "aspect":
        return Array.from(tableRegistry.aspectPacks.keys()).sort();
      case "domain":
        return Array.from(tableRegistry.domainPacks.keys()).sort();
      case "oracle":
        return ["Action", "Theme", "Descriptor", "Focus"];
      case "oracleCombo":
        return ["Action+Theme", "Descriptor+Focus"];
      default:
        return [];
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col bg-slate-900 p-6 overflow-y-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-slate-200 mb-4", children: "Weave Editor" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1", children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: localWeave.name,
              onChange: (e) => handleNameChange(e.target.value),
              className: "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-slate-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1", children: "Author" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: localWeave.author,
              onChange: (e) => handleAuthorChange(e.target.value),
              className: "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-slate-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1", children: "Die Size" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: localWeave.maxRoll,
              onChange: (e) => handleMaxRollChange(Number(e.target.value)),
              className: "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-slate-500",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "4", children: "d4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "6", children: "d6" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "8", children: "d8" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "10", children: "d10" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "12", children: "d12" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "20", children: "d20" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "100", children: "d100" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleRoll,
            disabled: localWeave.rows.length === 0,
            className: "flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 rounded transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Dices, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Roll" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleSave,
            disabled: isSaving || localWeave.rows.length === 0,
            className: "flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: isSaving ? "Saving..." : "Save" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-800 border-b border-slate-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide", children: "From" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide", children: "To" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide", children: "Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide", children: "Target" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: localWeave.rows.map((row, index) => {
          const isLastRow = index === localWeave.rows.length - 1;
          const targetOptions = getTargetOptions(row.targetType);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-800 hover:bg-slate-850", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: row.from,
                onChange: (e) => handleRowRangeChange(row.id, "from", Number(e.target.value)),
                className: "w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-slate-500",
                min: 1,
                max: localWeave.maxRoll
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: row.to,
                onChange: (e) => handleRowRangeChange(row.id, "to", Number(e.target.value)),
                className: "w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-slate-500",
                min: 1,
                max: localWeave.maxRoll
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: row.targetType,
                onChange: (e) => handleRowTypeChange(row.id, e.target.value),
                className: "w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-slate-500",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "aspect", children: "Aspect" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "domain", children: "Domain" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "oracle", children: "Oracle" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "oracleCombo", children: "Oracle Combo" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: row.targetId,
                onChange: (e) => handleRowTargetChange(row.id, e.target.value),
                className: "w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-slate-500",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select target..." }),
                  targetOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option, children: option }, option))
                ]
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              isLastRow && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: handleAddRow,
                  className: "p-1 hover:bg-slate-700 rounded transition-colors",
                  "data-tooltip": "Add row",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 text-slate-400" })
                }
              ),
              isLastRow && localWeave.rows.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => handleRemoveRow(row.id),
                  className: "p-1 hover:bg-slate-700 rounded transition-colors",
                  "data-tooltip": "Remove row",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 text-red-400" })
                }
              )
            ] }) })
          ] }, row.id);
        }) })
      ] }),
      localWeave.rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 mb-4", children: "No rows yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleAddRow,
            className: "flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 text-slate-300" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-300", children: "Add First Row" })
            ]
          }
        )
      ] })
    ] })
  ] });
}
function CenterLane() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const renderTabContent = () => {
    if (!activeTab) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-slate-400", children: "No tabs open" }) });
    }
    switch (activeTab.type) {
      case "weave":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(WeaveEditor, { weaveId: activeTab.id });
      case "entry":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-slate-400", children: "Entry editor coming soon..." }) });
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-900 h-full flex flex-col", children: [
    tabs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 bg-slate-800 border-b border-slate-700 px-2 overflow-x-auto", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `flex items-center gap-2 px-3 py-2 border-r border-slate-700 cursor-pointer transition-colors ${activeTabId === tab.id ? "bg-slate-900 text-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-750"}`,
        onClick: () => setActiveTab(tab.id),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm whitespace-nowrap", children: tab.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                closeTab(tab.id);
              },
              className: "p-0.5 hover:bg-slate-700 rounded transition-colors",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
            }
          )
        ]
      },
      tab.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-hidden", children: renderTabContent() })
  ] });
}
export {
  CenterLane
};
