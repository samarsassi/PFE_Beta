import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WorkflowCondition, WorkflowConditionService } from 'src/app/Services/workflow/workflow-condition.service';
import { BpmnEditorComponent } from '../bpmn-editor/bpmn-editor.component';

@Component({
  selector: 'app-workflow-form',
  templateUrl: './workflow-form.component.html',
  styleUrls: ['./workflow-form.component.css']
})
export class WorkflowFormComponent {
  conditionForm: FormGroup;
  isFormVisible = false;
  public flows: string[] = [];
  existingConditions: WorkflowCondition[] = [];
  editingCondition: WorkflowCondition | null = null;

  @ViewChild('conditionModal') conditionModal!: TemplateRef<any>;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private conditionService: WorkflowConditionService,
    private bpmnEditor: BpmnEditorComponent // Inject BpmnEditorComponent
  ) {
    this.conditionForm = this.fb.group({
      gatewayId: ['', Validators.required],
      flowId: ['', Validators.required],
      conditionExpression: ['', Validators.required],
      conditionName: ['', Validators.required]
    });
  }

  openModal(gatewayId: string) {
    // Get flows from BpmnEditorComponent
    this.flows = this.bpmnEditor.getFlowsForGateway(gatewayId);
    console.log('Opening modal for', gatewayId, 'with flows:', this.flows); // Debug
    if (!this.flows.length) {
      alert(`No outgoing flows found for gateway ${gatewayId}. Please add sequence flows in the BPMN diagram.`);
    }
    this.conditionForm.reset({ gatewayId });
    this.editingCondition = null;
    this.loadExistingConditions(gatewayId);
    this.modalService.open(this.conditionModal, { ariaLabelledBy: 'modal-title' }).result.then(
      () => {},
      () => this.conditionForm.reset()
    );
  }

  private loadExistingConditions(gatewayId: string) {
    this.conditionService.getConditionsByGateway(gatewayId).subscribe({
      next: (conditions) => {
        this.existingConditions = conditions;
        console.log('Existing conditions for', gatewayId, ':', conditions);
      },
      error: (err) => console.error('Error loading conditions:', err)
    });
  }

  editCondition(condition: WorkflowCondition) {
    this.editingCondition = condition;
    this.conditionForm.patchValue(condition);
  }

  deleteCondition(conditionId: number) {
    if (confirm('Are you sure you want to delete this condition?')) {
      this.conditionService.deleteCondition(conditionId).subscribe({
        next: () => {
          this.existingConditions = this.existingConditions.filter(c => c.id !== conditionId);
          alert('Condition deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting condition:', err);
          alert('Failed to delete condition');
        }
      });
    }
  }

  saveCondition() {
    if (this.conditionForm.valid) {
      const conditionData: WorkflowCondition = {
        ...this.conditionForm.value,
        id: this.editingCondition?.id,
        isActive: true
      };
      this.conditionService.saveCondition(conditionData).subscribe({
        next: (saved) => {
          alert(`Condition ${this.editingCondition ? 'updated' : 'created'} successfully`);
          this.loadExistingConditions(conditionData.gatewayId);
          this.conditionForm.reset({ gatewayId: conditionData.gatewayId });
          this.editingCondition = null;
          this.modalService.dismissAll();
        },
        error: (err) => {
          console.error('Error saving condition:', err);
          alert('Failed to save condition');
        }
      });
    }
  }
}