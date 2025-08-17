import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from "@angular/core";
import BpmnModeler from "bpmn-js/lib/Modeler";
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from "bpmn-js-properties-panel";
import PaletteModule from "bpmn-js/lib/features/palette";
import ContextPadModule from "bpmn-js/lib/features/context-pad";
import ModelingModule from "bpmn-js/lib/features/modeling";
import flowableModdleDescriptor from "src/app/Components/bpmn-editor/flowable-moddle.json";
import type Canvas from "diagram-js/lib/core/Canvas";
import { HttpClient } from "@angular/common/http";

interface Moddle {
  extensions: { [key: string]: any };
}

interface ElementRegistry {
  forEach: (callback: (element: BpmnElement) => void) => void;
  get: (id: string) => BpmnElement | undefined;
}

interface Modeling {
  updateProperties: (element: BpmnElement, properties: { [key: string]: any }) => void;
}

interface BpmnElement {
  id: string;
  type: string;
  businessObject: { get: (key: string) => any; [key: string]: any };
}

interface SelectionChangedEvent {
  oldSelection: BpmnElement[];
  newSelection: BpmnElement[];
}

@Component({
  selector: "app-bpmn-editor",
  templateUrl: "./bpmn-editor.component.html",
  styleUrls: ["./bpmn-editor.component.css"],
})
export class BpmnEditorComponent implements OnInit, OnDestroy {
  @ViewChild("canvas", { static: true }) private canvasRef!: ElementRef;
  @ViewChild("properties", { static: true }) private propertiesRef!: ElementRef;
  @ViewChild("palette", { static: true }) private paletteRef!: ElementRef;

  private modeler!: BpmnModeler;
  delegateClasses: { [key: string]: string } = {};
  selectedElement: BpmnElement | null = null;
  objectKeys = Object.keys;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.modeler = new BpmnModeler({
      container: this.canvasRef.nativeElement,
      propertiesPanel: { parent: this.propertiesRef.nativeElement },
      palette: { parent: this.paletteRef.nativeElement },
      additionalModules: [
        PaletteModule,
        ContextPadModule,
        ModelingModule,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
      ],
      moddleExtensions: {
        flowable: flowableModdleDescriptor,
      },
    });

    const initialDiagram = this.getEmptyDiagram();
    this.loadDiagram(initialDiagram);
    this.fetchDelegateClasses();

    // Fix TypeScript type for selection.changed
    this.modeler.on("selection.changed", (event: SelectionChangedEvent) => {
      const newSelection = event.newSelection[0];
      this.selectedElement = newSelection?.type === "bpmn:ServiceTask" ? newSelection : null;
    });

    const moddle = this.modeler.get("moddle") as Moddle;
    console.log("Moddle extensions:", moddle.extensions);
  }

  ngOnDestroy() {
    if (this.modeler) {
      this.modeler.destroy();
    }
  }

  async fetchDelegateClasses() {
    try {
      const response = await this.http
        .get<{ [key: string]: string }>("http://localhost:8089/api/workflows/delegates")
        .toPromise();
      this.delegateClasses = response || {};
      console.log("Available delegate classes:", this.delegateClasses);
    } catch (err) {
      console.error("Error fetching delegate classes:", err);
    }
  }

  async loadDiagram(xml: string) {
    try {
      await this.modeler.importXML(xml);
      const canvas = this.modeler.get<Canvas>("canvas");
      canvas.zoom("fit-viewport");
    } catch (err) {
      console.error("Error loading diagram", err);
    }
  }

  async saveDiagram(): Promise<string> {
  try {
    const modeling = this.modeler.get("modeling") as Modeling;
    const elementRegistry = this.modeler.get("elementRegistry") as ElementRegistry;

    elementRegistry.forEach((element: BpmnElement) => {
      if (element.type === "bpmn:ServiceTask" && element.businessObject) {
        const delegateExpr = element.businessObject.get("flowable:delegateExpression");
          if (!delegateExpr && Object.keys(this.delegateClasses).length > 0) {
              const defaultBean = Object.keys(this.delegateClasses)[0];
              modeling.updateProperties(element, { "flowable:delegateExpression": `\${${defaultBean}}` });
          }
      }
      else if (element.type === "bpmn:UserTask" && element.businessObject) {
        const assigneeAttr = element.businessObject.get("flowable:assignee");
        if (!assigneeAttr) {
          modeling.updateProperties(element, { "flowable:assignee": "user1" });
        }
      }
    });

    // Always get a string, even if xml is undefined
    const { xml: rawXml } = await this.modeler.saveXML({ format: true });
    let fixedXml: string = rawXml ?? "";

    if (!fixedXml.includes('xmlns:flowable="http://flowable.org/bpmn"')) {
      fixedXml = fixedXml.replace(
        /<bpmn:definitions([^>]*)>/,
        '<bpmn:definitions$1 xmlns:flowable="http://flowable.org/bpmn">'
      );
    }

    if (!this.validateBpmnXml(fixedXml)) {
      throw new Error("Generated BPMN XML is invalid");
    }
    return fixedXml;
  } catch (err) {
    console.error("Error saving diagram", err);
    throw err;
  }
}


  async deployDiagramToBackend() {
    try {
      const xml = await this.saveDiagram();
      const response = await this.http
        .post("http://localhost:8089/api/workflows/deploy", xml, {
          headers: { "Content-Type": "application/xml" },
          responseType: "text" as "json",
        })
        .toPromise();

      console.log("Workflow deployed successfully:", response);
    } catch (err: any) {
      console.error("Deployment failed:", err);
    }
  }

  async downloadDiagram() {
    try {
      const xml = await this.saveDiagram();
      const cleanedXml = xml.replace(/<bpmn:sequenceFlow id="[^"]+" sourceRef="[^"]+" ?\/>/g, "");
      const blob = new Blob([cleanedXml], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "diagram.bpmn";
      a.click();

      window.URL.revokeObjectURL(url);
      console.log("Diagram downloaded successfully");
    } catch (err) {
      console.error("Error downloading diagram", err);
    }
  }

  onDelegateChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const modeling = this.modeler.get("modeling") as Modeling;
    if (this.selectedElement) {
      modeling.updateProperties(this.selectedElement, { "flowable:class": value });
    }
  }

  private validateBpmnXml(xml: string): boolean {
    let isValid = true;
    const errors: string[] = [];

    if (!xml.includes('xmlns:flowable="http://flowable.org/bpmn"')) {
      errors.push("Missing flowable namespace");
      isValid = false;
    }

    if (!isValid) {
      console.error("BPMN XML validation errors:", errors.join("; "));
    }
    return isValid;
  }

  private getEmptyDiagram(): string {
    return `
      <?xml version="1.0" encoding="UTF-8"?>
      <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                        xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                        xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                        xmlns:flowable="http://flowable.org/bpmn"
                        targetNamespace="http://www.flowable.org/processdef">
        <bpmn:process id="Process_1" isExecutable="true">
          <bpmn:startEvent id="StartEvent_1"/>
        </bpmn:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
          <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
            <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
              <dc:Bounds x="100" y="100" width="36" height="36"/>
            </bpmndi:BPMNShape>
          </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
      </bpmn:definitions>
    `;
  }
}
