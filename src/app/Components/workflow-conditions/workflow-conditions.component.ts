import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { WorkflowConditionService } from '../../Services/workflow/workflow-condition.service';

interface WorkflowCondition {
  id?: number;
  gatewayId: string;
  flowId: string;
  conditionExpression: string;
  conditionName: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-workflow-conditions',
  templateUrl: './workflow-conditions.component.html',
  styleUrls: ['./workflow-conditions.component.css']
})
export class WorkflowConditionsComponent implements OnInit {
  
  conditions: WorkflowCondition[] = [];
  gateways: string[] = [];
  conditionForm: FormGroup;
  editingCondition: WorkflowCondition | null = null;
  isFormVisible = false;
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private workflowConditionService: WorkflowConditionService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.conditionForm = this.fb.group({
      gatewayId: ['', Validators.required],
      flowId: ['', Validators.required],
      conditionExpression: ['', Validators.required],
      conditionName: ['', Validators.required],
      description: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadGateways();
    this.loadConditions();

    // When a gateway is selected in the BPMN editor, open the form and preselect it
    this.workflowConditionService.gatewaySelected$.subscribe((gatewayId) => {
      this.editingCondition = null;
      this.isFormVisible = true;
      this.conditionForm.reset();
      // ensure dropdown contains the selected gateway id
      if (gatewayId && !this.gateways.includes(gatewayId)) {
        this.gateways = [gatewayId, ...this.gateways];
      }
      this.conditionForm.patchValue({ gatewayId });
      // Force selection visibly and trigger change detection
      this.conditionForm.get('gatewayId')?.setValue(gatewayId, { emitEvent: true });
      this.cdr.detectChanges();
      this.loadConditionsForGateway(gatewayId);
    });

    // Support deep-link navigation with ?gatewayId=
    this.route.queryParamMap.subscribe(params => {
      const gw = params.get('gatewayId');
      if (gw) {
        this.editingCondition = null;
        this.isFormVisible = true;
        this.conditionForm.reset();
        if (!this.gateways.includes(gw)) {
          this.gateways = [gw, ...this.gateways];
        }
        this.conditionForm.patchValue({ gatewayId: gw });
        this.conditionForm.get('gatewayId')?.setValue(gw, { emitEvent: true });
        this.cdr.detectChanges();
        this.loadConditionsForGateway(gw);
      }
    });
  }
  
  loadGateways(): void {
    this.workflowConditionService.getAllGatewayIds()
      .subscribe({
        next: (gateways) => {
          this.gateways = gateways;
        },
        error: (error) => {
          console.error('Error loading gateways:', error);
        }
      });
  }
  
  loadConditions(): void {
    this.workflowConditionService.getConditionsByGateway('CV_Score_Decision')
      .subscribe({
        next: (conditions) => {
          this.conditions = conditions;
        },
        error: (error) => {
          console.error('Error loading conditions:', error);
        }
      });
  }

  private loadConditionsForGateway(gatewayId: string): void {
    if (!gatewayId) { return; }
    this.workflowConditionService.getConditionsByGateway(gatewayId)
      .subscribe({
        next: (conditions) => {
          this.conditions = conditions;
        },
        error: (error) => {
          console.error('Error loading conditions for gateway', gatewayId, error);
        }
      });
  }
  
  showAddForm(): void {
    this.editingCondition = null;
    this.conditionForm.reset();
    this.conditionForm.patchValue({
      gatewayId: 'CV_Score_Decision'
    });
    this.isFormVisible = true;
  }
  
  showEditForm(condition: WorkflowCondition): void {
    this.editingCondition = condition;
    this.conditionForm.patchValue({
      gatewayId: condition.gatewayId,
      flowId: condition.flowId,
      conditionExpression: condition.conditionExpression,
      conditionName: condition.conditionName,
      description: condition.description
    });
    this.isFormVisible = true;
  }
  
  hideForm(): void {
    this.isFormVisible = false;
    this.editingCondition = null;
    this.conditionForm.reset();
  }
  
  saveCondition(): void {
    if (this.conditionForm.valid) {
      const conditionData = this.conditionForm.value;
      
      if (this.editingCondition) {
        // Update existing condition
        this.workflowConditionService.saveCondition({ id: this.editingCondition.id, ...conditionData })
          .subscribe({
            next: () => {
              this.loadConditions();
              this.hideForm();
            },
            error: (error) => {
              console.error('Error updating condition:', error);
            }
          });
      } else {
        // Create new condition
        this.workflowConditionService.saveCondition(conditionData)
          .subscribe({
            next: () => {
              this.loadConditions();
              this.hideForm();
            },
            error: (error) => {
              console.error('Error creating condition:', error);
            }
          });
      }
    }
  }
  
  deleteCondition(conditionId: number): void {
    if (confirm('Are you sure you want to delete this condition?')) {
      this.workflowConditionService.deleteCondition(conditionId)
        .subscribe({
          next: () => {
            this.loadConditions();
          },
          error: (error) => {
            console.error('Error deleting condition:', error);
          }
        });
    }
  }
  
  initializeDefaults(): void {
    this.workflowConditionService.initializeDefaults()
      .subscribe({
        next: () => {
          this.loadConditions();
          alert('Default conditions initialized successfully!');
        },
        error: (error) => {
          console.error('Error initializing defaults:', error);
          alert('Failed to initialize default conditions');
        }
      });
  }
}
