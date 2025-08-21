import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from "@angular/core";
import BpmnModeler from "bpmn-js/lib/Modeler";
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from "bpmn-js-properties-panel";
import PaletteModule from "bpmn-js/lib/features/palette";
import ContextPadModule from "bpmn-js/lib/features/context-pad";
import ModelingModule from "bpmn-js/lib/features/modeling";
import flowableModdleDescriptor from "src/app/Components/bpmn-editor/flowable-moddle.json";
import type Canvas from "diagram-js/lib/core/Canvas";
import { HttpClient } from "@angular/common/http";
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

interface DelegateInfo {
  beanName: string;
  className: string;
  description: string;
}

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
  @ViewChild('canvas', { static: true }) 
private canvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild("properties", { static: true }) private propertiesRef!: ElementRef;
  @ViewChild("palette", { static: true }) private paletteRef!: ElementRef;

  private modeler!: BpmnModeler;
  delegateClasses: DelegateInfo[] = [];
  selectedElement: BpmnElement | null = null;
 selectedDelegate: string | null = null;


  constructor(private http: HttpClient) {}

private viewer!: BpmnViewer;
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

  // Load a diagram (empty or latest from backend)
  this.loadLatestDiagram();

  // Attach selection.changed listener
  this.modeler.on("selection.changed", (event: SelectionChangedEvent) => {
    const newSelection = event.newSelection[0];
    if (newSelection?.type === "bpmn:ServiceTask") {
      this.selectedElement = newSelection;

      const delegateExpr = newSelection.businessObject.get("flowable:delegateExpression");
      this.selectedDelegate = delegateExpr ? delegateExpr.replace(/\${(.*)}/, "$1") : null;
    } else {
      this.selectedElement = null;
      this.selectedDelegate = null;
    }
  });

  this.fetchDelegateClasses();
}



  ngOnDestroy() {
    if (this.modeler) {
      this.modeler.destroy();
    }
  }

  async fetchDelegateClasses() {
    try {
      const response = await this.http
        .get<DelegateInfo[]>("http://localhost:8089/api/workflows/delegates")
        .toPromise();
      this.delegateClasses = response || [];
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
      const serviceTasksWithoutDelegates: string[] = [];

      elementRegistry.forEach((element: BpmnElement) => {
        if (element.type === "bpmn:ServiceTask" && element.businessObject) {
          const delegateExpr = element.businessObject.get("flowable:delegateExpression");
          if (!delegateExpr || !this.delegateClasses.some(d => delegateExpr === `\${${d.beanName}}`)) {
            serviceTasksWithoutDelegates.push(element.id);
          }
        } else if (element.type === "bpmn:UserTask" && element.businessObject) {
          const assigneeAttr = element.businessObject.get("flowable:assignee");
          if (!assigneeAttr) {
            modeling.updateProperties(element, { "flowable:assignee": "${hrUser}" });
          }
        }
      });

      if (serviceTasksWithoutDelegates.length > 0) {
        throw new Error(`Service tasks without valid delegate expressions: ${serviceTasksWithoutDelegates.join(', ')}. Please assign valid delegates.`);
      }

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
      console.log("Starting deployment process...");
      const xml = await this.saveDiagram();
      console.log("Diagram saved successfully, XML length:", xml.length);
      const response = await this.http
        .post("http://localhost:8089/api/workflows/deploy", xml, {
          headers: { "Content-Type": "text/plain" },
          responseType: "text" as "json",
        })
        .toPromise();
      console.log("Workflow deployed successfully:", response);
      alert("Workflow deployed successfully to Flowable!");
    } catch (err: any) {
      console.error("Deployment failed:", err);
      let errorMessage = "Deployment failed";
      if (err.status === 400 && err.error) {
        errorMessage += `: ${err.error}`;
      } else {
        errorMessage += `: ${err.message || 'Unknown error'}`;
      }
      alert(errorMessage);
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
      modeling.updateProperties(this.selectedElement, { "flowable:delegateExpression": `\${${value}}` });
    }
  }
  

  private validateBpmnXml(xml: string): boolean {
    let isValid = true;
    const errors: string[] = [];

    if (!xml.includes('xmlns:flowable="http://flowable.org/bpmn"')) {
      errors.push("Missing flowable namespace");
      isValid = false;
    }

    const delegateRegex = /\${([^}]+)}/g;
    let match;
    while ((match = delegateRegex.exec(xml)) !== null) {
      const delegate = match[1];
      if (!this.delegateClasses.some(d => d.beanName === delegate)) {
        errors.push(`Invalid delegate expression: ${delegate}`);
        isValid = false;
      }
    }

    if (!isValid) {
      console.error("BPMN XML validation errors:", errors.join("; "));
    }
    return isValid;
  }

// Helper to get current delegate from selected element
getCurrentDelegate(element: BpmnElement | null): string | null {
  if (!element || !element.businessObject) return null;
  return element.businessObject["flowable:delegateExpression"]
    ?.replace(/^\${|}$/g, '') || null;
}

// Load latest BPMN XML from backend
private async loadLatestDiagram(): Promise<void> {
  try {
    const xml = await this.http.get('http://localhost:8089/api/workflows/latest', { responseType: 'text' }).toPromise();
    if (!xml) {
      throw new Error('No BPMN XML returned from backend');
    }
    await this.modeler.importXML(xml);
    const canvas = this.modeler.get<Canvas>('canvas');
    canvas.zoom('fit-viewport');
  } catch (err) {
    console.error('Failed to load latest diagram', err);
    await this.loadDiagram(this.getEmptyDiagram());
  }
}

// Fallback if nothing is deployed
private getEmptyDiagram(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                      xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                      xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                      xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                      xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                      targetNamespace="http://bpmn.io/schema/bpmn">
      <bpmn:process id="Process_1" isExecutable="true">
        <bpmn:startEvent id="StartEvent_1"/>
      </bpmn:process>
    </bpmn:definitions>`;
}
}