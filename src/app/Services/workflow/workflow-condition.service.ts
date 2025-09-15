import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { Observable, ReplaySubject } from "rxjs"

export interface WorkflowCondition {
  id?: number
  gatewayId: string
  flowId: string
  conditionExpression: string
  conditionName: string
  description?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  isDefault?: boolean
}

@Injectable({
  providedIn: "root",
})
export class WorkflowConditionService {
  private baseUrl = "http://localhost:8089/api/workflow-conditions"
  // Event bus to notify when a gateway is selected in the BPMN editor
  private gatewaySelectedSubject = new ReplaySubject<string>(1)
  gatewaySelected$ = this.gatewaySelectedSubject.asObservable()

  constructor(private http: HttpClient) {}

  /**
   * Get all conditions for a specific gateway
   */
  getConditionsByGateway(gatewayId: string): Observable<WorkflowCondition[]> {
    return this.http.get<WorkflowCondition[]>(`${this.baseUrl}/gateway/${gatewayId}`)
  }

  /**
   * Get all gateway IDs that have conditions
   */
  getAllGatewayIds(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/gateways`)
  }

  /**
   * Create or update a condition
   */
  saveCondition(condition: WorkflowCondition): Observable<WorkflowCondition> {
    if (condition.id) {
      return this.http.put<WorkflowCondition>(`${this.baseUrl}/${condition.id}`, condition)
    } else {
      return this.http.post<WorkflowCondition>(this.baseUrl, condition)
    }
  }

  /**
   * Delete a condition
   */
  deleteCondition(conditionId: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${conditionId}`, { responseType: "text" })
  }

  /**
   * Initialize default conditions
   */
  initializeDefaults(): Observable<string> {
    return this.http.post(`${this.baseUrl}/initialize-defaults`, {}, { responseType: "text" })
  }

  /**
   * Get condition expression for a specific flow
   */
  getConditionExpression(flowId: string): Observable<{ expression: string }> {
    return this.http.get<{ expression: string }>(`${this.baseUrl}/flow/${flowId}/expression`)
  }

  /**
   * Apply conditions to BPMN XML
   * This method takes BPMN XML and applies the stored conditions
   */
 applyConditionsToBpmn(xml: string, conditions: WorkflowCondition[]): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'application/xml');

      // Namespace resolver
      const nsResolver: XPathNSResolver = (prefix: string | null) => {
        if (prefix === 'bpmn') return 'http://www.omg.org/spec/BPMN/20100524/MODEL';
        return null;
      };

      // Find all gateways
      const snapshot = xmlDoc.evaluate(
        "//bpmn:exclusiveGateway | //bpmn:inclusiveGateway | //bpmn:parallelGateway",
        xmlDoc,
        nsResolver,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );

      for (let i = 0; i < snapshot.snapshotLength; i++) {
        const gateway = snapshot.snapshotItem(i) as Element;
        const gatewayId = gateway.getAttribute('id');
        if (!gatewayId) continue;

        // Get all conditions for this gateway
        const gatewayConditions = conditions.filter(c => c.gatewayId === gatewayId);

        // Reset default attribute
        gateway.removeAttribute('flowable:default');

        gatewayConditions.forEach(c => {
          const seqFlow = xmlDoc.getElementById(c.flowId);
          if (!seqFlow) {
            console.warn(`Sequence flow ${c.flowId} not found for gateway ${gatewayId}`);
            return;
          }

          if (c.isDefault) {
            gateway.setAttribute('flowable:default', c.flowId);
            // Default flow should not have conditionExpression
            seqFlow.removeAttribute('flowable:conditionExpression');
          } else {
            // Non-default flows must have a conditionExpression
            seqFlow.setAttribute('flowable:conditionExpression', c.conditionExpression || 'true');
          }
        });
      }

      const serializer = new XMLSerializer();
      const modifiedXml = serializer.serializeToString(xmlDoc);
      resolve(modifiedXml);

    } catch (err) {
      reject(err);
    }
  });
}


  /**
   * Emit selected gateway id so other components (e.g., Conditions UI)
   * can react (open form, preselect gateway, etc.).
   */
  emitGatewaySelected(gatewayId: string): void {
    if (gatewayId) {
      this.gatewaySelectedSubject.next(gatewayId)
    }
  }

  /**
   * Extract current conditions from BPMN XML
   * This method parses BPMN XML to find existing conditions
   */
  extractConditionsFromBpmn(bpmnXml: string): WorkflowCondition[] {
    const conditions: WorkflowCondition[] = []
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(bpmnXml, "text/xml")

    // Find all sequence flows with condition expressions
    const sequenceFlows = xmlDoc.querySelectorAll("bpmn\\:sequenceFlow, sequenceFlow")

    sequenceFlows.forEach((flow: Element) => {
      const flowId = flow.getAttribute("id")
      const sourceRef = flow.getAttribute("sourceRef")
      const conditionExpression = flow.querySelector("bpmn\\:conditionExpression, conditionExpression")

      if (flowId && sourceRef && conditionExpression) {
        const expression = conditionExpression.textContent || ""

        // Check if source is a gateway
        const sourceElement = xmlDoc.querySelector(`[id="${sourceRef}"]`)
        if (
          sourceElement &&
          (sourceElement.tagName.includes("exclusiveGateway") ||
            sourceElement.tagName.includes("inclusiveGateway") ||
            sourceElement.tagName.includes("parallelGateway"))
        ) {
          conditions.push({
            gatewayId: sourceRef,
            flowId: flowId,
            conditionExpression: expression,
            conditionName: `Condition for ${flowId}`,
            isActive: true,
          })
        }
      }
    })

    return conditions
  }
}
