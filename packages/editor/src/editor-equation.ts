import type { EquationElement } from "@onodocs/sdk";

type Sequence = EquationElement[];
export function showEquation(root: ShadowRoot, initial: readonly EquationElement[], existing: boolean, apply: (equation: readonly EquationElement[] | null) => Promise<void>, signal: AbortSignal): void {
  const dialog = document.createElement("dialog"), form = document.createElement("form"), style = document.createElement("style");
  dialog.className = "equation-dialog"; dialog.setAttribute("aria-label", "Equation"); form.className = "equation-form";
  style.textContent = `dialog.equation-dialog{width:min(840px,calc(100vw - 32px));max-width:calc(100vw - 32px);max-height:calc(100dvh - 32px);overflow:hidden}.equation-form{width:100%;max-width:100%;display:flex;flex-direction:column;gap:12px;max-height:calc(100dvh - 88px);min-height:0}.equation-preview{padding:18px;border:1px solid #dce1e6;border-radius:6px;overflow:auto;min-height:80px;font-size:24px;background:#fff;flex-shrink:0;max-height:22vh}.equation-presets{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;margin-top:8px}.equation-presets button{display:flex;flex-direction:column;gap:6px;height:auto;min-height:84px;padding:10px;text-align:center;white-space:normal;min-width:0;overflow-wrap:anywhere}.equation-presets math{max-width:100%;flex-shrink:0;font-size:16px}.equation-form details{flex-shrink:0}.equation-form details[open]{max-height:24vh;overflow:auto}.equation-builder{max-height:48vh;min-height:0;overflow:auto;flex:1}.equation-row{border:1px solid #dce1e6;border-radius:5px;padding:8px;margin:6px 0;min-width:0}.equation-tools,.equation-symbols{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.equation-row input{position:static!important;opacity:1!important;width:100%!important;height:32px!important}.equation-arguments{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr));gap:8px}.equation-arguments fieldset{min-width:0;border:1px solid #e3e7ed;padding:6px}.equation-row input[type=checkbox]{width:16px!important;height:16px!important;vertical-align:middle}.equation-tools label:has(input[type=checkbox]){display:flex;align-items:center;gap:5px}.equation-tools button{min-width:28px}.equation-row>.equation-tools{justify-content:flex-end;margin-bottom:6px}.equation-row>.equation-tools strong{margin-right:auto}.equation-tools select{max-width:160px}.equation-symbols button{font-size:18px;min-width:32px}.equation-form details.equation-spacing[open]{max-height:none;overflow:visible}.equation-form .dialog-actions{flex-shrink:0;display:flex;justify-content:flex-end;gap:8px}`;
  const title = document.createElement("h2"); title.textContent = existing ? "Edit equation" : "Insert equation";
  const preview = document.createElement("div"), builder = document.createElement("div"), symbols = document.createElement("div"), error = document.createElement("p"), actions = document.createElement("div");
  preview.className = "equation-preview"; preview.setAttribute("aria-label", "Equation preview"); builder.className = "equation-builder"; symbols.className = "equation-symbols"; symbols.setAttribute("aria-label", "Math symbols"); error.setAttribute("role", "alert"); error.hidden = true; actions.className = "dialog-actions";
  let content = structuredClone(initial) as Sequence, active: HTMLInputElement | undefined, busy = false;
  const labels = { text: "Text", bar: "Bar", groupCharacter: "Grouping character", box: "Grouping box", borderBox: "Border box", equationArray: "Equation array", limit: "Limit", function: "Function", fraction: "Fraction", superscript: "Exponent", subscript: "Subscript", subSuperscript: "Subscript and exponent", preScripts: "Left scripts", radical: "Radical", delimiter: "Brackets", matrix: "Matrix", nary: "Large operator", accent: "Accent" };
  const text = (value = ""): Sequence => [{ kind: "text", text: value }];
  function button(parent: HTMLElement, label: string, visible: string, action: () => void): HTMLButtonElement { const button = document.createElement("button"); button.type = "button"; button.textContent = visible; button.setAttribute("aria-label", label); button.title = label; button.addEventListener("click", action); parent.append(button); return button; }
  function math(values: readonly EquationElement[], functionName = false): Element {
    const create = (tag: string, children: (Element | string)[] = []) => { const element = document.createElementNS("http://www.w3.org/1998/Math/MathML", tag); element.append(...children); return element; };
    return create("mrow", values.map(value => {
      if (value.kind === "text") { const numeric = /^\d+$/.test(value.text); const node = create((value.normalText || value.literal) && value.script === undefined ? "mtext" : numeric ? "mn" : "mi", [value.script === "double-struck" ? [...value.text || "□"].map(scalar => ({ C: "ℂ", N: "ℕ", Q: "ℚ", R: "ℝ", Z: "ℤ" } as Readonly<Record<string, string>>)[scalar.toUpperCase()] ?? scalar).join("") : value.text || "□"]); node.setAttribute("mathvariant", "normal"); node.setAttribute("style", `font-style:${functionName || value.functionName || (value.normalText || value.literal) && value.script === undefined || numeric ? "normal" : "italic"}`); return node; }
      if (value.kind === "groupCharacter") return create(value.position === "top" ? "mover" : "munder", [math(value.base, functionName), create("mo", [value.character])]);
      if (value.kind === "bar") { const node = create(value.position === "top" ? "mover" : "munder", [math(value.base, functionName), create("mo", ["¯"])]); node.setAttribute(value.position === "top" ? "accent" : "accentunder", "true"); return node; }
      if (value.kind === "box" || value.kind === "borderBox") { const node = math(value.base, functionName); if (value.kind === "borderBox" && value.strikeHorizontal && value.hideTop === undefined && value.hideBottom === undefined && value.hideLeft === undefined && value.hideRight === undefined) node.setAttribute("style", "text-decoration:line-through"); return node; }
      if (value.kind === "equationArray") return create("mtable", value.rows.map(row => create("mtr", [create("mtd", [math(row, functionName)])])));
      if (value.kind === "limit") return create(value.position === "lower" ? "munder" : "mover", [math(value.base, functionName), math(value.limit)]);
      if (value.kind === "function") { const spacing = create("mspace"); spacing.setAttribute("width", "0.1em"); return create("mrow", [math(value.name, true), create("mo", ["⁡"]), spacing, math(value.argument, functionName)]); }
      if (value.kind === "fraction") { if (value.type === "lin") return create("mrow", [math(value.numerator, functionName), create("mo", ["/"]), math(value.denominator, functionName)]); const node = create("mfrac", [math(value.numerator, functionName), math(value.denominator, functionName)]); if (value.type === "noBar") node.setAttribute("linethickness", "0"); return node; }
      if (value.kind === "superscript") return create("msup", [math(value.base, functionName), math(value.exponent, functionName)]);
      if (value.kind === "subscript") return create("msub", [math(value.base, functionName), math(value.index, functionName)]);
      if (value.kind === "preScripts") return create("mmultiscripts", [math(value.base, functionName), create("mprescripts"), math(value.index, functionName), math(value.exponent, functionName)]);
      if (value.kind === "subSuperscript") return create("msubsup", [math(value.base, functionName), math(value.index, functionName), math(value.exponent, functionName)]);
      if (value.kind === "accent") { const node = create("mover", [math(value.base, functionName), create("mo", [value.character])]); node.setAttribute("accent", "true"); return node; }
      if (value.kind === "nary") {
        const symbol = create("mo", [value.operator]), underOver = (value.limitLocation ?? ("∫∬∭∮∯∰".includes(value.operator) ? "subSup" : "underOver")) === "underOver";
        const operator = value.lower && value.upper ? create(underOver ? "munderover" : "msubsup", [symbol, math(value.lower, functionName), math(value.upper, functionName)]) : value.lower ? create(underOver ? "munder" : "msub", [symbol, math(value.lower, functionName)]) : value.upper ? create(underOver ? "mover" : "msup", [symbol, math(value.upper, functionName)]) : symbol;
        return create("mrow", [operator, math(value.base, functionName)]);
      }
      if (value.kind === "matrix") return create("mtable", value.rows.map(row => create("mtr", row.map(cell => create("mtd", [math(cell, functionName)])))));
      if (value.kind === "radical") return value.degree ? create("mroot", [math(value.base, functionName), math(value.degree, functionName)]) : create("msqrt", [math(value.base, functionName)]);
      return create("mrow", [create("mo", [value.opening ?? "("]), ...value.arguments.flatMap((argument, index) => index ? [create("mo", [value.separator ?? "|"]), math(argument, functionName)] : [math(argument, functionName)]), create("mo", [value.closing ?? ")"])]);
    }));
  }
  function updatePreview(): void { const node = document.createElementNS("http://www.w3.org/1998/Math/MathML", "math"); node.setAttribute("display", "block"); node.append(math(content)); preview.replaceChildren(node); }
  function input(parent: HTMLElement, name: string, value: string, change: (value: string) => void): void { const field = document.createElement("input"); field.value = value; field.setAttribute("aria-label", name); field.addEventListener("focus", () => { active = field; }); field.addEventListener("input", () => { change(field.value); updatePreview(); }); parent.append(field); }
  function selectSetting(parent: HTMLElement, label: string, options: readonly (readonly [string, string])[], value: string, change: (value: string) => void): void { const select = document.createElement("select"); select.setAttribute("aria-label", label); for (const [key, text] of options) select.add(new Option(text, key)); select.value = value; select.addEventListener("change", () => change(select.value)); parent.append(select); }
  function toggleSetting(parent: HTMLElement, text: string, value: boolean, change: (value: boolean) => void): void { const label = document.createElement("label"), input = document.createElement("input"); input.type = "checkbox"; input.checked = value; input.setAttribute("aria-label", text); input.addEventListener("change", () => change(input.checked)); label.append(input, document.createTextNode(text)); parent.append(label); }
  function sequence(parent: HTMLElement, values: Sequence, name: string): void {
    values.forEach((value, index) => {
      const row = document.createElement("div"), tools = document.createElement("div"), heading = document.createElement("strong"); row.className = "equation-row"; tools.className = "equation-tools"; heading.textContent = labels[value.kind]; tools.append(heading); row.append(tools); parent.append(row);
      const replace = (next: EquationElement) => { values[index] = next; };
      button(tools, `Move ${name} item ${index + 1} left`, "←", () => { [values[index - 1], values[index]] = [values[index]!, values[index - 1]!]; render(); }).disabled = index === 0;
      button(tools, `Move ${name} item ${index + 1} right`, "→", () => { [values[index + 1], values[index]] = [values[index]!, values[index + 1]!]; render(); }).disabled = index + 1 === values.length;
      button(tools, `Remove ${name} item ${index + 1}`, "×", () => { values.splice(index, 1); render(); });
      if (value.kind === "text") {
        const mode = document.createElement("select"); mode.setAttribute("aria-label", `${name} text mode ${index + 1}`); mode.add(new Option("Math text", "math")); mode.add(new Option("Normal text", "normal")); mode.value = value.normalText ? "normal" : "math";
        mode.addEventListener("change", () => { replace({ ...values[index] as Extract<EquationElement, {kind:"text"}>, normalText: mode.value === "normal" }); updatePreview(); }); tools.append(mode);
        const formatting = document.createElement("details"), summary = document.createElement("summary"), fields = document.createElement("div"); formatting.className = "equation-spacing"; summary.textContent = "Math formatting"; fields.className = "equation-tools"; formatting.append(summary, fields); row.append(formatting);
        const current = () => values[index] as Extract<EquationElement, { kind: "text" }>;
        selectSetting(fields, "Math alphabet", [["", "Default alphabet"], ["roman", "Roman"], ["script", "Script"], ["fraktur", "Fraktur"], ["double-struck", "Double-struck"], ["sans-serif", "Sans serif"], ["monospace", "Monospace"]], value.script ?? "", selected => { const { script, ...rest } = current(); replace(selected ? { ...rest, script: selected as import("@onodocs/sdk").EquationScript } : rest); updatePreview(); });
        selectSetting(fields, "Math style", [["", "Default style"], ["plain", "Plain"], ["bold", "Bold"], ["italic", "Italic"], ["boldItalic", "Bold italic"]], value.style ?? "", selected => { const { style, ...rest } = current(); replace(selected ? { ...rest, style: selected as import("@onodocs/sdk").EquationTextStyle } : rest); updatePreview(); });
        toggleSetting(fields, "Literal text", value.literal ?? false, literal => { replace({ ...current(), literal }); updatePreview(); });
        const hint = document.createElement("small"); hint.textContent = "Typography is saved for Word. Preview follows LibreOffice’s supported math alphabets and styles."; formatting.append(hint);
        input(row, `${name} text ${index + 1}`, value.text, value => replace({ ...values[index] as Extract<EquationElement, {kind:"text"}>, text: value }));
      }
      else {
        const operands = document.createElement("div"); operands.className = "equation-arguments"; row.append(operands);
        const operand = (label: string, content: readonly EquationElement[]) => { const fieldset = document.createElement("fieldset"), legend = document.createElement("legend"); legend.textContent = label; fieldset.append(legend); operands.append(fieldset); sequence(fieldset, content as Sequence, `${name} ${label.toLowerCase()}`); };
        if (value.kind === "groupCharacter") {
          const current = () => values[index] as Extract<EquationElement, { kind: "groupCharacter" }>;
          selectSetting(tools, "Grouping character", [...new Set(["⏞", "⏟", "→", "←", "↔", value.character])].map(character => [character, character]), value.character, character => { replace({ ...current(), character }); updatePreview(); });
          selectSetting(tools, "Grouping position", [["top", "Above"], ["bottom", "Below"]], value.position, position => { replace({ ...current(), position: position as "top" | "bottom" }); updatePreview(); });
          selectSetting(tools, "Grouping alignment", [["", "Default alignment"], ["top", "Top baseline"], ["bottom", "Bottom baseline"]], value.verticalJustification ?? "", selected => { const { verticalJustification, ...rest } = current(); replace(selected ? { ...rest, verticalJustification: selected as "top" | "bottom" } : rest); updatePreview(); });
          operand("Base", value.base);
        }
        else if (value.kind === "bar" || value.kind === "box" || value.kind === "borderBox") {
          const current = () => values[index] as typeof value;
          if (value.kind === "bar") selectSetting(tools, "Bar position", [["top", "Above"], ["bottom", "Below"]], value.position, position => { replace({ ...values[index] as Extract<EquationElement, { kind: "bar" }>, position: position as "top" | "bottom" }); updatePreview(); });
          else {
            const settings = document.createElement("details"), summary = document.createElement("summary"), fields = document.createElement("div"); summary.textContent = "Word box settings"; fields.className = "equation-tools"; settings.className = "equation-spacing"; settings.append(summary, fields); row.insertBefore(settings, operands);
            const names = value.kind === "box" ? [["operatorEmulator", "Operator spacing"], ["noBreak", "Keep together"], ["differential", "Differential"], ["alignment", "Align operator"]] as const : [["hideTop", "Hide top"], ["hideBottom", "Hide bottom"], ["hideLeft", "Hide left"], ["hideRight", "Hide right"], ["strikeHorizontal", "Horizontal strike"], ["strikeVertical", "Vertical strike"], ["strikeBottomLeftToTopRight", "Rising strike"], ["strikeTopLeftToBottomRight", "Falling strike"]] as const;
            for (const [key, label] of names) { const item = value as import("@onodocs/sdk").EquationBoxProperties & import("@onodocs/sdk").EquationBorderBoxProperties; toggleSetting(fields, label, item[key] ?? false, enabled => { replace({ ...current(), [key]: enabled }); updatePreview(); }); }
            if (value.kind === "box") {
              toggleSetting(fields, "Manual break", value.break !== undefined, enabled => { const { break: previous, ...rest } = values[index] as Extract<EquationElement, { kind: "box" }>; replace(enabled ? { ...rest, break: previous ?? {} } : rest); render(); });
              if (value.break) input(fields, "Break alignment point", value.break.alignmentAt === undefined ? "" : String(value.break.alignmentAt), input => { replace({ ...values[index] as Extract<EquationElement, { kind: "box" }>, break: input === "" ? {} : { alignmentAt: Number(input) } }); });
            }
            const hint = document.createElement("small"); hint.textContent = "Box settings are saved for Word. Preview follows LibreOffice; only horizontal strike is drawn."; row.append(hint);
          }
          operand("Base", value.base);
        }
        else if (value.kind === "equationArray") {
          const current = () => values[index] as Extract<EquationElement, { kind: "equationArray" }>;
          value.rows.forEach((content, i) => operand(`Row ${i + 1}`, content));
          button(tools, "Add equation row", "+ Row", () => { replace({ ...current(), rows: [...current().rows, text()] }); render(); });
          button(tools, "Remove last equation row", "− Row", () => { replace({ ...current(), rows: current().rows.slice(0, -1) }); render(); }).disabled = value.rows.length === 1;
          const settings = document.createElement("details"), summary = document.createElement("summary"), fields = document.createElement("div"); summary.textContent = "Word array settings"; fields.className = "equation-tools"; settings.className = "equation-spacing"; settings.append(summary, fields); row.insertBefore(settings, operands);
          selectSetting(fields, "Array baseline", [["top", "Top"], ["center", "Center"], ["bottom", "Bottom"]], value.baseAlignment ?? "center", selected => { replace({ ...current(), baseAlignment: selected as "top" | "center" | "bottom" }); updatePreview(); });
          selectSetting(fields, "Array row spacing", [["single", "Single"], ["oneAndHalf", "1.5"], ["double", "Double"], ["exact", "Exactly (points)"], ["multiple", "Multiple (lines)"]], value.rowSpacingRule ?? "single", selected => { replace({ ...current(), rowSpacingRule: selected as import("@onodocs/sdk").EquationSpacingRule }); render(); });
          if (value.rowSpacingRule === "exact" || value.rowSpacingRule === "multiple") input(fields, "Array row spacing value", String(value.rowSpacing ?? ""), input => { const { rowSpacing: previous, ...rest } = current(); replace(input === "" ? rest : { ...rest, rowSpacing: Number(input) }); });
          toggleSetting(fields, "Maximum distribution", value.maximumDistribution ?? false, enabled => replace({ ...current(), maximumDistribution: enabled }));
          toggleSetting(fields, "Object distribution", value.objectDistribution ?? false, enabled => replace({ ...current(), objectDistribution: enabled }));
          const hint = document.createElement("small"); hint.textContent = "Array settings are saved for Word. Preview uses LibreOffice’s centered stack."; row.append(hint);
        }
        else if (value.kind === "limit") {
          const position = document.createElement("select"); position.setAttribute("aria-label", "Limit position"); position.add(new Option("Below", "lower")); position.add(new Option("Above", "upper")); position.value = value.position;
          position.addEventListener("change", () => { replace({ ...values[index] as Extract<EquationElement, {kind:"limit"}>, position: position.value as "lower" | "upper" }); updatePreview(); }); tools.append(position); operand("Base", value.base); operand("Limit", value.limit);
        }
        else if (value.kind === "function") { operand("Function name", value.name); operand("Argument", value.argument); }
        else if (value.kind === "fraction") {
          const select = document.createElement("select"); select.setAttribute("aria-label", `${name} fraction style`); select.add(new Option("Stacked", "bar")); select.add(new Option("No bar", "noBar")); select.add(new Option("Linear", "lin")); select.add(new Option("Skewed", "skw"));
          const hint = document.createElement("small"); hint.textContent = "Skewed is saved for Word. The editor and PDF use LibreOffice’s stacked fraction."; hint.hidden = value.type !== "skw"; row.append(hint);
          select.value = value.type ?? "bar"; select.addEventListener("change", () => { replace({ ...value, type: select.value as NonNullable<Extract<EquationElement, {kind:"fraction"}>["type"]> }); hint.hidden = select.value !== "skw"; updatePreview(); }); tools.append(select);
          operand("Numerator", value.numerator); operand("Denominator", value.denominator);
        }
        else if (value.kind === "superscript") { operand("Base", value.base); operand("Exponent", value.exponent); }
        else if (value.kind === "subscript" || value.kind === "subSuperscript" || value.kind === "preScripts") { operand("Base", value.base); operand("Index", value.index); if (value.kind !== "subscript") operand("Exponent", value.exponent); }
        else if (value.kind === "accent") {
          const select = document.createElement("select"); select.setAttribute("aria-label", "Accent");
          const accents = [["̂", "Hat"], ["̃", "Tilde"], ["̄", "Bar"], ["̇", "Dot"], ["̈", "Double dot"], ["⃗", "Vector"], ["́", "Acute"], ["̀", "Grave"]];
          if (!accents.some(([character]) => character === value.character)) accents.push([value.character, "Imported accent"]);
          for (const [character, label] of accents) select.add(new Option(label, character)); select.value = value.character;
          select.addEventListener("change", () => { replace({ ...value, character: select.value }); updatePreview(); }); tools.append(select); operand("Base", value.base);
        }
        else if (value.kind === "nary") {
          const select = document.createElement("select"), location = document.createElement("select"); select.setAttribute("aria-label", "Large operator"); location.setAttribute("aria-label", "Limit placement");
          for (const symbol of [...new Set(["∑", "∏", "∐", "∫", "∬", "∭", "∮", "∯", "∰", value.operator])]) select.add(new Option(symbol, symbol));
          select.value = value.operator; select.addEventListener("change", () => { replace({ ...values[index] as Extract<EquationElement, {kind:"nary"}>, operator: select.value }); updatePreview(); });
          location.add(new Option("Above and below", "underOver")); location.add(new Option("Beside", "subSup")); location.value = value.limitLocation ?? ("∫∬∭∮∯∰".includes(value.operator) ? "subSup" : "underOver"); location.addEventListener("change", () => { replace({ ...values[index] as Extract<EquationElement, {kind:"nary"}>, limitLocation: location.value as "underOver" | "subSup" }); updatePreview(); }); tools.append(select, location);
          const hint = document.createElement("small"); hint.textContent = "Limit placement is saved for Word. The editor places limits above and below."; row.append(hint);
          for (const key of ["lower", "upper"] as const) button(tools, `${value[key] ? "Hide" : "Add"} ${key} limit`, `${value[key] ? "−" : "+"} ${key}`, () => { const current = values[index] as Extract<EquationElement, {kind:"nary"}>; const { [key]: removed, ...rest } = current; replace(removed ? rest : { ...current, [key]: text(key === "lower" ? "i=1" : "n") }); render(); });
          operand("Base", value.base); if (value.lower) operand("Lower limit", value.lower); if (value.upper) operand("Upper limit", value.upper);
        }
        else if (value.kind === "matrix") {
          const current = () => values[index] as Extract<EquationElement, { kind: "matrix" }>;
          const settings = document.createElement("div"); settings.className = "equation-tools"; row.insertBefore(settings, operands);
          const alignment = document.createElement("select"), placeholders = document.createElement("select"); alignment.setAttribute("aria-label", "Matrix baseline alignment"); placeholders.setAttribute("aria-label", "Matrix placeholders"); placeholders.style.maxWidth = "100%";
          for (const [key, label] of [["top", "Top baseline"], ["center", "Center baseline"], ["bottom", "Bottom baseline"]]) alignment.add(new Option(label, key)); alignment.value = value.baseAlignment ?? "center";
          alignment.addEventListener("change", () => { replace({ ...current(), baseAlignment: alignment.value as "top" | "center" | "bottom" }); updatePreview(); });
          placeholders.add(new Option("Show placeholders", "show")); placeholders.add(new Option("Hide placeholders", "hide")); placeholders.value = value.hidePlaceholders ? "hide" : "show";
          placeholders.addEventListener("change", () => { replace({ ...current(), hidePlaceholders: placeholders.value === "hide" }); updatePreview(); }); settings.append(alignment, placeholders);
          for (let c = 0; c < value.rows[0]!.length; c++) {
            const label = document.createElement("label"), select = document.createElement("select"); label.textContent = `Column ${c + 1} `; select.setAttribute("aria-label", `Matrix column ${c + 1} alignment`);
            for (const [key, text] of [["left", "Left"], ["center", "Center"], ["right", "Right"]]) select.add(new Option(text, key)); select.value = value.columnAlignments?.[c] ?? "center";
            select.addEventListener("change", () => { const matrix = current(), columnAlignments = [...matrix.columnAlignments ?? matrix.rows[0]!.map(() => "center" as const)]; columnAlignments[c] = select.value as "left" | "center" | "right"; replace({ ...matrix, columnAlignments }); updatePreview(); }); label.append(select); settings.append(label);
          }
          const spacing = document.createElement("details"), summary = document.createElement("summary"), spacingFields = document.createElement("div"); summary.textContent = "Matrix spacing"; spacing.className = "equation-spacing"; spacingFields.className = "equation-tools"; spacing.append(summary, spacingFields); row.insertBefore(spacing, operands);
          for (const [name, ruleKey, valueKey] of [["Row spacing", "rowSpacingRule", "rowSpacing"], ["Column gap", "columnGapRule", "columnGap"]] as const) {
            const label = document.createElement("label"), rule = document.createElement("select"), amountLabel = document.createElement("label"), amount = document.createElement("input"); label.textContent = name; rule.setAttribute("aria-label", `Matrix ${name.toLowerCase()} rule`); amount.type = "number"; amount.min = "0"; amount.setAttribute("aria-label", `Matrix ${name.toLowerCase()} value`);
            for (const [key, text] of [["single", "Single"], ["oneAndHalf", "1.5"], ["double", "Double"], ["exact", "Exactly"], ["multiple", "Multiple"]]) rule.add(new Option(text, key)); rule.value = value[ruleKey] ?? "single"; amount.value = value[valueKey] === undefined ? "" : String(value[valueKey]); amount.placeholder = "Default";
            const units = () => { amountLabel.firstChild!.textContent = rule.value === "exact" ? "Points " : name === "Row spacing" ? "Lines " : "Em "; amount.step = rule.value === "exact" ? name === "Row spacing" ? "1" : "0.05" : "0.5"; amount.disabled = !["exact", "multiple"].includes(rule.value); };
            amountLabel.append(document.createTextNode(""), amount); units(); label.append(rule); spacingFields.append(label, amountLabel);
            rule.addEventListener("change", () => { replace({ ...current(), [ruleKey]: rule.value }); units(); updatePreview(); });
            amount.addEventListener("input", () => { const { [valueKey]: previous, ...rest } = current(); replace(amount.value === "" ? rest : { ...rest, [valueKey]: Number(amount.value) }); updatePreview(); });
          }
          const widthLabel = document.createElement("label"), width = document.createElement("input"); widthLabel.textContent = "Minimum column width (pt)"; width.type = "number"; width.min = "0"; width.step = "0.05"; width.placeholder = "Default"; width.setAttribute("aria-label", "Matrix minimum column width (pt)"); width.value = value.minimumColumnWidth === undefined ? "" : String(value.minimumColumnWidth); widthLabel.append(width); spacingFields.append(widthLabel);
          width.addEventListener("input", () => { const { minimumColumnWidth: previous, ...rest } = current(); replace(width.value === "" ? rest : { ...rest, minimumColumnWidth: Number(width.value) }); updatePreview(); });
          const hint = document.createElement("small"); hint.textContent = "These settings are saved for Word. The editor and PDF use centered matrices with default spacing and no empty-cell placeholders."; row.insertBefore(hint, operands);
          operands.style.gridTemplateColumns = `repeat(${value.rows[0]!.length}, minmax(170px, 1fr))`; operands.style.overflowX = "auto";
          value.rows.forEach((row, r) => row.forEach((cell, c) => operand(`Row ${r + 1} column ${c + 1}`, cell)));
          button(tools, "Add matrix row", "+ Row", () => { const matrix = current(); replace({ ...matrix, rows: [...matrix.rows, matrix.rows[0]!.map(() => text())] }); render(); });
          button(tools, "Remove last matrix row", "− Row", () => { const matrix = current(); replace({ ...matrix, rows: matrix.rows.slice(0, -1) }); render(); }).disabled = value.rows.length === 1;
          button(tools, "Add matrix column", "+ Column", () => { const matrix = current(); replace({ ...matrix, rows: matrix.rows.map(row => [...row, text()]), ...(matrix.columnAlignments === undefined ? {} : { columnAlignments: [...matrix.columnAlignments, "center"] }) }); render(); });
          button(tools, "Remove last matrix column", "− Column", () => { const matrix = current(); replace({ ...matrix, rows: matrix.rows.map(row => row.slice(0, -1)), ...(matrix.columnAlignments === undefined ? {} : { columnAlignments: matrix.columnAlignments.slice(0, -1) }) }); render(); }).disabled = value.rows[0]!.length === 1;
        }
        else if (value.kind === "radical") { operand("Base", value.base); if (value.degree) operand("Degree", value.degree); button(tools, value.degree ? "Use square root" : "Add root degree", value.degree ? "√" : "ⁿ√", () => { const { degree, ...rest } = values[index] as Extract<EquationElement, {kind:"radical"}>; replace({ ...rest, ...(degree ? {} : { degree: text("3") }) }); render(); }); }
        else { input(tools, "Opening bracket", value.opening ?? "(", opening => replace({ ...values[index] as Extract<EquationElement, {kind:"delimiter"}>, opening })); input(tools, "Closing bracket", value.closing ?? ")", closing => replace({ ...values[index] as Extract<EquationElement, {kind:"delimiter"}>, closing })); input(tools, "Argument separator", value.separator ?? "|", separator => replace({ ...values[index] as Extract<EquationElement, {kind:"delimiter"}>, separator })); value.arguments.forEach((argument, i) => operand(`Argument ${i + 1}`, argument)); button(tools, "Add bracket argument", "+ Argument", () => { replace({ ...values[index] as Extract<EquationElement, {kind:"delimiter"}>, arguments: [...value.arguments, text()] }); render(); }); }
      }
    });
    const tools = document.createElement("div"), select = document.createElement("select"); tools.className = "equation-tools"; select.setAttribute("aria-label", `Structure for ${name}`); for (const [value, label] of Object.entries(labels)) select.add(new Option(label, value)); tools.append(select); parent.append(tools);
    button(tools, `Add to ${name}`, "+ Add", () => { const kind = select.value; values.push(kind === "groupCharacter" ? { kind, character: "⏟", position: "bottom", base: text("a + b") } : kind === "bar" ? { kind, position: "top", base: text("x") } : kind === "box" || kind === "borderBox" ? { kind, base: text("x") } : kind === "equationArray" ? { kind, rows: [text("x = a"), text("y = b")] } : kind === "limit" ? { kind, position: "lower", base: text("x"), limit: text("n") } : kind === "function" ? { kind, name: [{ kind: "text", text: "sin", functionName: true }], argument: text("x") } : kind === "fraction" ? { kind, numerator: text(), denominator: text() } : kind === "superscript" ? { kind, base: text(), exponent: text("2") } : kind === "subscript" ? { kind, base: text(), index: text("1") } : (kind === "subSuperscript" || kind === "preScripts") ? { kind, base: text(), index: text("1"), exponent: text("2") } : kind === "radical" ? { kind, base: text() } : kind === "nary" ? { kind, operator: "∑", base: text("x"), lower: text("i=1"), upper: text("n"), limitLocation: "underOver" } : kind === "accent" ? { kind, character: "̂", base: text("x") } : kind === "matrix" ? { kind, rows: [[text(), text()], [text(), text()]] } : kind === "delimiter" ? { kind, arguments: [text()] } : { kind: "text", text: "" }); render(); });
  }
  function render(): void { active = undefined; builder.replaceChildren(); sequence(builder, content, "equation"); updatePreview(); }
  for (const value of ["α", "β", "γ", "θ", "π", "λ", "μ", "σ", "ω", "∞", "±", "×", "÷", "≤", "≥", "≠", "≈", "∂", "∇", "∑", "∫"]) button(symbols, `Insert ${value}`, value, () => { if (active?.isConnected) { active.setRangeText(value, active.selectionStart ?? active.value.length, active.selectionEnd ?? active.value.length, "end"); active.dispatchEvent(new Event("input")); active.focus(); } else { content.push({ kind: "text", text: value }); render(); } });
  const templates = document.createElement("details"), summary = document.createElement("summary"), gallery = document.createElement("div"); summary.textContent = "Equation templates"; gallery.className = "equation-presets"; templates.append(summary, gallery);
  const square = (value: string): EquationElement => ({ kind: "superscript", base: text(value), exponent: text("2") });
  const presets: readonly Readonly<{ name: string; content: Sequence }>[] = [
    { name: "Quadratic formula", content: [...text("x = "), { kind: "fraction", numerator: [...text("−b ± "), { kind: "radical", base: [square("b"), ...text(" − 4ac")] }], denominator: text("2a") }] },
    { name: "Pythagorean theorem", content: [square("a"), ...text(" + "), square("b"), ...text(" = "), square("c")] },
    { name: "Binomial coefficient", content: [{ kind: "delimiter", arguments: [[{ kind: "fraction", type: "noBar", numerator: text("n"), denominator: text("k") }]] }] },
    { name: "Limit", content: [{ kind: "function", name: [{ kind: "limit", position: "lower", base: [{ kind: "text", text: "lim", functionName: true }], limit: text("n→∞") }], argument: text("x") }] },
    { name: "Sine function", content: [{ kind: "function", name: [{ kind: "text", text: "sin", functionName: true }], argument: [{ kind: "delimiter", arguments: [text("x")] }] }] },
    { name: "Summation", content: [{ kind: "nary", operator: "∑", base: [{ kind: "subscript", base: text("x"), index: text("i") }], lower: text("i=1"), upper: text("n"), limitLocation: "underOver" }] },
    { name: "Definite integral", content: [{ kind: "nary", operator: "∫", base: text("f(x) dx"), lower: text("a"), upper: text("b"), limitLocation: "subSup" }] },
    { name: "Identity matrix", content: [{ kind: "delimiter", opening: "[", closing: "]", arguments: [[{ kind: "matrix", rows: [[text("1"), text("0")], [text("0"), text("1")]] }]] }] },
    { name: "Vector", content: [{ kind: "accent", character: "⃗", base: text("v") }] },
    { name: "Underbrace", content: [{ kind: "limit", position: "lower", base: [{ kind: "groupCharacter", character: "⏟", position: "bottom", base: text("a + b") }], limit: text("n") }] },
    { name: "Equation system", content: [{ kind: "delimiter", opening: "{", closing: "", arguments: [[{ kind: "equationArray", rows: [text("x + y = 1"), text("x − y = 0")] }]] }] },
    { name: "Overbar", content: [{ kind: "bar", position: "top", base: text("x") }] },
    { name: "Isotope", content: [{ kind: "preScripts", base: [{ kind: "text", text: "C", normalText: true }], index: text("6"), exponent: text("14") }] },
    { name: "Indexed variable", content: [{ kind: "subSuperscript", base: text("x"), index: text("i"), exponent: text("2") }] },
  ];
  for (const preset of presets) {
    const control = button(gallery, `Insert ${preset.name}`, preset.name, () => { if (content.length === 1 && content[0]?.kind === "text" && !content[0].text) content = []; content.push(...structuredClone(preset.content)); templates.open = false; render(); });
    const formula = document.createElementNS("http://www.w3.org/1998/Math/MathML", "math"); formula.setAttribute("display", "block"); formula.append(math(preset.content)); control.prepend(formula);
  }
  const close = () => { dialog.close(); dialog.remove(); signal.removeEventListener("abort", close); };
  async function commit(value: readonly EquationElement[] | null): Promise<void> { if (busy) return; busy = true; error.hidden = true; const enabled = [...form.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>("button,input,select")].filter(element => !element.disabled); for (const element of enabled) element.disabled = true; try { await apply(value); close(); } catch (failure) { error.textContent = failure instanceof Error ? failure.message : String(failure); error.hidden = false; } finally { busy = false; for (const element of enabled) element.disabled = false; } }
  if (existing) button(actions, "Remove equation", "Remove equation", () => void commit(null));
  button(actions, "Cancel", "Cancel", close); const submit = document.createElement("button"); submit.type = "submit"; submit.textContent = existing ? "Apply" : "Insert"; actions.append(submit);
  form.addEventListener("submit", event => { event.preventDefault(); void commit(content); }); dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); else close(); }); signal.addEventListener("abort", close, { once: true }); form.append(title, preview, templates, symbols, builder, error, actions); dialog.append(style, form); root.append(dialog); render(); dialog.showModal(); builder.querySelector("input")?.focus();
}
