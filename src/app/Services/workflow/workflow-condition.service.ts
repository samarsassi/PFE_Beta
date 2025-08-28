import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';

export interface WorkflowCondition {
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

@Injectable({
  providedIn: 'root'
})
export class WorkflowConditionService {
  
  private baseUrl = 'http://localhost:8089/api/workflow-conditions';
  // Event bus to notify when a gateway is selected in the BPMN editor
  private gatewaySelectedSubject = new ReplaySubject<string>(1);
  gatewaySelected$ = this.gatewaySelectedSubject.asObservable();
  
  constructor(private http: HttpClient) { }
  
  /**
   * Get all conditions for a specific gateway
   */
  getConditionsByGateway(gatewayId: string): Observable<WorkflowCondition[]> {
    return this.http.get<WorkflowCondition[]>(`${this.baseUrl}/gateway/${gatewayId}`);
  }
  
  /**
   * Get all gateway IDs that have conditions
   */
  getAllGatewayIds(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/gateways`);
  }
  
  /**
   * Create or update a condition
   */
  saveCondition(condition: WorkflowCondition): Observable<WorkflowCondition> {
    if (condition.id) {
      return this.http.put<WorkflowCondition>(`${this.baseUrl}/${condition.id}`, condition);
    } else {
      return this.http.post<WorkflowCondition>(this.baseUrl, condition);
    }
  }
  
  /**
   * Delete a condition
   */
  deleteCondition(conditionId: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${conditionId}`, { responseType: 'text' });
  }
  
  /**
   * Initialize default conditions
   */
  initializeDefaults(): Observable<string> {
    return this.http.post(`${this.baseUrl}/initialize-defaults`, {}, { responseType: 'text' });
  }
  
  /**
   * Get condition expression for a specific flow
   */
  getConditionExpression(flowId: string): Observable<{expression: string}> {
    return this.http.get<{expression: string}>(`${this.baseUrl}/flow/${flowId}/expression`);
  }
  
  /**
   * Apply conditions to BPMN XML
   * This method takes BPMN XML and applies the stored conditions
   */
  applyConditionsToBpmn(bpmnXml: string): Observable<string> {
    return new Observable<string>(observer => {
      // First get all gateway IDs
      this.getAllGatewayIds().subscribe({
        next: (gatewayIds) => {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(bpmnXml, 'application/xml');

            // Check for XML parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
              throw new Error('Invalid BPMN XML: ' + parserError.textContent);
            }

            // Ensure Flowable namespace is present
            const definitions = xmlDoc.querySelector('bpmn\\:definitions');
            if (definitions && !definitions.getAttribute('xmlns:flowable')) {
              definitions.setAttribute('xmlns:flowable', 'http://flowable.org/bpmn');
            }

            // Fetch and apply conditions for each gateway
            const applyConditionsPromises = gatewayIds.map(gatewayId =>
              this.getConditionsByGateway(gatewayId).toPromise()
            );

            Promise.all(applyConditionsPromises).then(results => {
              results.forEach(conditions => {
                if (conditions) {
                  conditions.forEach(condition => {
                    if (condition.isActive) {
                      // Find the sequenceFlow element by ID
                      const flowElements = xmlDoc.getElementsByTagNameNS(
                        'http://www.omg.org/spec/BPMN/20100524/MODEL',
                        'sequenceFlow'
                      );
                      let targetFlow: Element | null = null;
                      for (let i = 0; i < flowElements.length; i++) {
                        if (flowElements[i].getAttribute('id') === condition.flowId) {
                          targetFlow = flowElements[i];
                          break;
                        }
                      }

                      if (targetFlow) {
                        // Remove existing conditionExpression if any
                        const existingCondition = targetFlow.getElementsByTagNameNS(
                          'http://www.omg.org/spec/BPMN/20100524/MODEL',
                          'conditionExpression'
                        );
                        while (existingCondition.length > 0) {
                          existingCondition[0].parentNode?.removeChild(existingCondition[0]);
                        }

                        // Create new conditionExpression element
                        const conditionElement = xmlDoc.createElementNS(
                          'http://www.omg.org/spec/BPMN/20100524/MODEL',
                          'conditionExpression'
                        );
                        conditionElement.setAttributeNS(
                          'http://www.w3.org/2001/XMLSchema-instance',
                          'xsi:type',
                          'bpmn:tFormalExpression'
                        );
                        conditionElement.textContent = condition.conditionExpression;

                        // Append to sequenceFlow
                        targetFlow.appendChild(conditionElement);
                      } else {
                        console.warn(`Sequence flow ${condition.flowId} not found in XML`);
                      }
                    }
                  });
                }
              });

              // Serialize back to string
              const serializer = new XMLSerializer();
              const modifiedXml = serializer.serializeToString(xmlDoc);

              // Validate the modified XML
              const validationDoc = parser.parseFromString(modifiedXml, 'application/xml');
              const validationError = validationDoc.querySelector('parsererror');
              if (validationError) {
                console.error('Modified XML parsing error:', validationError.textContent);
                observer.error(new Error('Generated XML is not well-formed'));
                return;
              }

              console.log('Modified BPMN XML:', modifiedXml);
              observer.next(modifiedXml);
              observer.complete();
            }).catch(error => observer.error(error));
          } catch (error) {
            observer.error(error);
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }
  
  /**
   * Emit selected gateway id so other components (e.g., Conditions UI)
   * can react (open form, preselect gateway, etc.).
   */
  emitGatewaySelected(gatewayId: string): void {
    if (gatewayId) {
      this.gatewaySelectedSubject.next(gatewayId);
    }
  }

  /**
   * Extract current conditions from BPMN XML
   * This method parses BPMN XML to find existing conditions
   */
  extractConditionsFromBpmn(bpmnXml: string): WorkflowCondition[] {
    const conditions: WorkflowCondition[] = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(bpmnXml, 'text/xml');
    
    // Find all sequence flows with condition expressions
    const sequenceFlows = xmlDoc.querySelectorAll('bpmn\\:sequenceFlow, sequenceFlow');
    
    sequenceFlows.forEach((flow: Element) => {
      const flowId = flow.getAttribute('id');
      const sourceRef = flow.getAttribute('sourceRef');
      const conditionExpression = flow.querySelector('bpmn\\:conditionExpression, conditionExpression');
      
      if (flowId && sourceRef && conditionExpression) {
        const expression = conditionExpression.textContent || '';
        
        // Check if source is a gateway
        const sourceElement = xmlDoc.querySelector(`[id="${sourceRef}"]`);
        if (sourceElement && (
          sourceElement.tagName.includes('exclusiveGateway') || 
          sourceElement.tagName.includes('inclusiveGateway') ||
          sourceElement.tagName.includes('parallelGateway')
        )) {
          conditions.push({
            gatewayId: sourceRef,
            flowId: flowId,
            conditionExpression: expression,
            conditionName: `Condition for ${flowId}`,
            isActive: true
          });
        }
      }
    });
    
    return conditions;
  }



}