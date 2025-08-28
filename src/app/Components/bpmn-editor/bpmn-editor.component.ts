import { Component, ElementRef, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { HttpClient } from '@angular/common/http';
import PaletteModule from 'bpmn-js/lib/features/palette';
import ContextPadModule from 'bpmn-js/lib/features/context-pad';
import ModelingModule from 'bpmn-js/lib/features/modeling';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import flowableModdleDescriptor from 'src/app/Components/bpmn-editor/flowable-moddle.json';
import { WorkflowFormComponent } from '../workflow-form/workflow-form.component';
import { WorkflowConditionService } from 'src/app/Services/workflow/workflow-condition.service';
import { WorkflowService } from 'src/app/Services/fn/workflow/workflow.service';

interface DelegateInfo {
  beanName: string;
  className: string;
  description: string;
}

interface BpmnElement {
  id: string;
  type: string;
  businessObject: { get: (key: string) => any; [key: string]: any };
  [key: string]: any;
}

@Component({
  selector: 'app-bpmn-editor',
  templateUrl: './bpmn-editor.component.html',
  styleUrls: ['./bpmn-editor.component.css']
})
export class BpmnEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef;
  @ViewChild('properties', { static: true }) private propertiesRef!: ElementRef;
  @ViewChild('palette', { static: true }) private paletteRef!: ElementRef;
  @ViewChild(WorkflowFormComponent) workflowForm!: WorkflowFormComponent;

  private modeler!: BpmnModeler;
  delegateClasses: DelegateInfo[] = [];
  selectedElement: BpmnElement | null = null;
  selectedDelegate: string | null = null;
  HistoryVersions: string[] = [];
  selectedHistoryVersion: string = '';


  constructor(private http: HttpClient, 
    private conditionService: WorkflowConditionService,
    private workflowService: WorkflowService
  ) {}

  ngOnInit() {
    this.fetchDelegateClasses();
    this.getHistoryVersions();
  }

  ngAfterViewInit() {
    this.initModeler();
    this.loadLatestDiagram()
      .then(() => {
        // Selection listener (for delegate dropdown)
        this.modeler.on('selection.changed', (event: any) => {
          const newSelection = event.newSelection?.[0];
          if (!newSelection) {
            this.selectedElement = null;
            this.selectedDelegate = null;
            return;
          }

          this.selectedElement = newSelection;

          if (newSelection.type === 'bpmn:ServiceTask') {
            const delegateExpr = newSelection.businessObject.get('flowable:delegateExpression');
            this.selectedDelegate = delegateExpr ? delegateExpr.replace(/\${(.*)}/, '$1') : null;
          } else {
            this.selectedDelegate = null;
          }
        });

        // Double-click listener (open modal on gateways)
        this.modeler.on('element.dblclick', (evt: any) => {
          const el = evt?.element as BpmnElement | undefined;
          if (!el) return;
          if (/Gateway$/.test(el.type)) {
            const flows: string[] = (el['outgoing'] || []).map((f: any) => f.id);
            console.log('Double-click flows for', el.id, ':', flows); // Debug
            this.workflowForm.flows = flows;
            this.workflowForm.openModal(el.id);
            this.conditionService.emitGatewaySelected(el.id);
          }
        });
      })
      .catch(err => console.error('Initialization error:', err));
  }

  ngOnDestroy() {
    if (this.modeler) this.modeler.destroy();
  }

  private initModeler() {
    this.modeler = new BpmnModeler({
      container: this.canvasRef.nativeElement,
      propertiesPanel: {
        parent: this.propertiesRef.nativeElement
      },
      palette: { parent: this.paletteRef.nativeElement },
      additionalModules: [
        PaletteModule,
        ContextPadModule,
        ModelingModule,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule
      ],
      moddleExtensions: { flowable: flowableModdleDescriptor }
    });
  }

  getFlowsForGateway(gatewayId: string): string[] {
    const elementRegistry: any = this.modeler.get('elementRegistry');
    const gateway = elementRegistry.get(gatewayId);
    if (!gateway) {
      console.error(`Gateway ${gatewayId} not found in the model`);
      return [];
    }
    if (!/Gateway$/.test(gateway.type)) {
      console.error(`Element ${gatewayId} is not a gateway`);
      return [];
    }
    const flows: string[] = (gateway.outgoing || []).map((f: any) => f.id);
    console.log('Flows for', gatewayId, ':', flows); // Debug
    return flows;
  }

  private async fetchDelegateClasses() {
    try {
      const response = await this.http
        .get<DelegateInfo[]>('http://localhost:8089/api/workflows/delegates')
        .toPromise();
      this.delegateClasses = response || [];
    } catch (err) {
      console.error('Error fetching delegate classes:', err);
    }
  }

  private async loadLatestDiagram(): Promise<void> {
    try {
      const xml = await this.http
        .get('http://localhost:8089/api/workflows/latest', { responseType: 'text' })
        .toPromise();
      console.log('Loaded XML:', (xml ?? '').substring(0, 200) + '...'); // Debug
      await this.loadDiagram(xml && xml.length ? xml : this.getEmptyDiagram());
    } catch (err) {
      console.error('Failed to load latest diagram', err);
      await this.loadDiagram(this.getEmptyDiagram());
    }
  }

private async loadDiagram(xml: string) {
  if (!this.modeler) return;

  try {
    // Import XML directly (bpmn-js handles clearing the previous diagram internally)
    const { warnings } = await this.modeler.importXML(xml);

    if (warnings && warnings.length) {
      console.warn('BPMN import warnings:', warnings);
    }

    // Zoom to fit viewport
    const canvas: any = this.modeler.get('canvas');
    if (canvas.zoom) canvas.zoom('fit-viewport');

    console.log('Diagram loaded successfully');
  } catch (err) {
    console.error('Error loading diagram:', err);
    alert('Failed to load BPMN diagram. Check console for details.');
  }
}



private getHistoryVersions(): void {
  this.workflowService.getHistoryVersions().subscribe({
    next: (versions: string[]) => {
      this.HistoryVersions = versions;
      console.log('Loaded history versions:', this.HistoryVersions);
    },
    error: (err) => {
      console.error('Failed to load history versions:', err);
    }
  });
}
loadSelectedHistory(): void {
  if (!this.selectedHistoryVersion) {
    alert('Please select a history version to load');
    return;
  }

  this.workflowService.getHistoryVersionXml(this.selectedHistoryVersion).subscribe({
    next: async (xml: string) => {
      console.log('Loaded history XML:', xml.substring(0, 200) + '...');
      await this.loadDiagram(xml); // load into modeler
      alert(`Loaded history version: ${this.selectedHistoryVersion}`);
    },
    error: (err) => {
      console.error('Failed to load history version:', err);
      alert('Failed to load history version: ' + err.message);
    }
  });
}

  private getEmptyDiagram(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                        xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                        xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                        xmlns:flowable="http://flowable.org/bpmn"
                        targetNamespace="http://bpmn.io/schema/bpmn">
        <bpmn:process id="Process_1" isExecutable="true">
          <bpmn:startEvent id="StartEvent_1" />
          <bpmn:sequenceFlow id="SequenceFlow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
          <bpmn:task id="Task_1" />
        </bpmn:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
          <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
            <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
              <dc:Bounds x="100" y="100" width="36" height="36" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
              <dc:Bounds x="200" y="100" width="100" height="80" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNEdge id="SequenceFlow_1_di" bpmnElement="SequenceFlow_1">
              <di:waypoint x="136" y="118" />
              <di:waypoint x="200" y="140" />
            </bpmndi:BPMNEdge>
          </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
      </bpmn:definitions>`;
  }

  async downloadDiagram() {
    const { xml } = await this.modeler.saveXML({ format: true });
    const blob = new Blob([xml ?? ''], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.bpmn';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async deployDiagramToBackend() {
  try {
    // Always get current modeler XML
    const { xml } = await this.modeler.saveXML({ format: true });
    if (!xml) throw new Error('No BPMN XML available');

    const modifiedXml = await this.conditionService.applyConditionsToBpmn(xml).toPromise();
    console.log('Deploying XML:', modifiedXml);

    await this.http.post('http://localhost:8089/api/workflows/deploy', 
      { xml: modifiedXml },
      { responseType: 'text' }
    ).toPromise();

    alert('Diagram deployed successfully!');
  } catch (err) {
    console.error('Error deploying diagram:', err);
    alert('Failed to deploy diagram.');
  }
}


  async extractAndSaveConditions() {
    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      console.log('Extracting conditions from XML:', (xml ?? '').substring(0, 200) + '...');
      alert('Conditions extracted and logged to console!');
    } catch (err) {
      console.error('Error extracting conditions:', err);
      alert('Failed to extract conditions.');
    }
  }

  onDelegateChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (this.selectedElement) {
      const modeling: any = this.modeler.get('modeling');
      modeling.updateProperties(this.selectedElement, {
        'flowable:delegateExpression': `\${${value}}`
      });
    }
  }
}