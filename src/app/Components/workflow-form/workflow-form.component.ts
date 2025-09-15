import { Component,  TemplateRef, ViewChild,  OnInit } from "@angular/core"
import {  FormGroup,  FormBuilder, Validators } from "@angular/forms"
import  { NgbModal } from "@ng-bootstrap/ng-bootstrap"
import  { WorkflowCondition, WorkflowConditionService } from "src/app/Services/workflow/workflow-condition.service"
import  { BpmnEditorComponent } from "../bpmn-editor/bpmn-editor.component"

@Component({
  selector: "app-workflow-form",
  templateUrl: "./workflow-form.component.html",
  styleUrls: ["./workflow-form.component.css"],
})
export class WorkflowFormComponent implements OnInit {
  conditionForm: FormGroup
  isFormVisible = false
  public flows: string[] = []
  existingConditions: WorkflowCondition[] = []
  editingCondition: WorkflowCondition | null = null

  @ViewChild("conditionModal") conditionModal!: TemplateRef<any>

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private conditionService: WorkflowConditionService,
    private bpmnEditor: BpmnEditorComponent, // Inject BpmnEditorComponent
  ) {
    this.conditionForm = this.fb.group({
      gatewayId: ["", Validators.required],
      flowId: ["", Validators.required],
      conditionExpression: [""], // will set validators dynamically
      conditionName: [""],
      isDefault: [false],
    })
  }

  ngOnInit(): void {
    this.conditionForm.get("isDefault")!.valueChanges.subscribe((isDefault: boolean) => {
      const exprCtrl = this.conditionForm.get("conditionExpression")!
      const nameCtrl = this.conditionForm.get("conditionName")!

      if (isDefault) {
        exprCtrl.clearValidators()
        nameCtrl.clearValidators()
      } else {
        exprCtrl.setValidators([Validators.required])
        nameCtrl.setValidators([Validators.required])
      }

      exprCtrl.updateValueAndValidity()
      nameCtrl.updateValueAndValidity()
    })
  }

  openModal(gatewayId: string) {
    // Get flows from BpmnEditorComponent
    this.flows = this.bpmnEditor.getFlowsForGateway(gatewayId)
    console.log("Opening modal for", gatewayId, "with flows:", this.flows)
    if (!this.flows.length) {
      alert(`No outgoing flows found for gateway ${gatewayId}. Please add sequence flows in the BPMN diagram.`)
    }
    this.conditionForm.reset({ gatewayId, isDefault: false })
    this.editingCondition = null
    this.loadExistingConditions(gatewayId)
    this.modalService.open(this.conditionModal, { ariaLabelledBy: "modal-title" }).result.then(
      () => {},
      () => this.conditionForm.reset(),
    )
  }

  private loadExistingConditions(gatewayId: string) {
    this.conditionService.getConditionsByGateway(gatewayId).subscribe({
      next: (conditions) => {
        this.existingConditions = conditions
        console.log("Existing conditions for", gatewayId, ":", conditions)
      },
      error: (err) => console.error("Error loading conditions:", err),
    })
  }

  editCondition(condition: WorkflowCondition) {
    this.editingCondition = condition
    this.conditionForm.patchValue(condition)

    if (condition.isDefault) {
      this.conditionForm.get("conditionExpression")!.clearValidators()
      this.conditionForm.get("conditionName")!.clearValidators()
    } else {
      this.conditionForm.get("conditionExpression")!.setValidators([Validators.required])
      this.conditionForm.get("conditionName")!.setValidators([Validators.required])
    }

    this.conditionForm.get("conditionExpression")!.updateValueAndValidity()
    this.conditionForm.get("conditionName")!.updateValueAndValidity()
  }

  deleteCondition(conditionId: number) {
    if (confirm("Are you sure you want to delete this condition?")) {
      this.conditionService.deleteCondition(conditionId).subscribe({
        next: () => {
          this.existingConditions = this.existingConditions.filter((c) => c.id !== conditionId)
          alert("Condition deleted successfully")
        },
        error: (err) => {
          console.error("Error deleting condition:", err)
          alert("Failed to delete condition")
        },
      })
    }
  }

  saveCondition() {
    if (this.conditionForm.invalid) return

    const formValue = this.conditionForm.value
    const gatewayId = formValue.gatewayId

    const conditionData: WorkflowCondition = {
      ...formValue,
      id: this.editingCondition?.id,
      isActive: true,
      conditionExpression: formValue.isDefault ? "" : formValue.conditionExpression,
      conditionName: formValue.isDefault ? `Default Flow` : formValue.conditionName,
    }

    if (conditionData.isDefault) {
      const hasOtherDefault = this.existingConditions.some(
        (c) => c.id !== conditionData.id && c.isDefault && c.gatewayId === gatewayId,
      )

      if (hasOtherDefault) {
        // First, unset default for all other conditions in the same gateway
        const updatePromises = this.existingConditions
          .filter((c) => c.id !== conditionData.id && c.isDefault)
          .map((c) => {
            c.isDefault = false
            return this.conditionService.saveCondition(c).toPromise()
          })

        // Wait for all updates to complete before saving the new default
        Promise.all(updatePromises)
          .then(() => {
            this.saveConditionData(conditionData, gatewayId)
          })
          .catch((err) => {
            console.error("Error updating existing default conditions:", err)
            alert("Failed to update existing default conditions")
          })
      } else {
        this.saveConditionData(conditionData, gatewayId)
      }
    } else {
      this.saveConditionData(conditionData, gatewayId)
    }
  }

  private saveConditionData(conditionData: WorkflowCondition, gatewayId: string) {
    this.conditionService.saveCondition(conditionData).subscribe({
      next: (savedCondition) => {
        console.log("Condition saved successfully:", savedCondition)
        this.loadExistingConditions(gatewayId) // reload conditions
        this.conditionForm.reset({ gatewayId, isDefault: false })
        this.editingCondition = null
        this.modalService.dismissAll()

        const conditionType = savedCondition.isDefault ? "Default condition" : "Condition"
        alert(`${conditionType} saved successfully for flow ${savedCondition.flowId}`)
      },
      error: (err) => {
        console.error("Failed to save condition:", err)
        alert("Failed to save condition: " + (err.error?.message || err.message))
      },
    })
  }
}
