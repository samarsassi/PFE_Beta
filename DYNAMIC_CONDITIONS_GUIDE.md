# Dynamic Workflow Conditions Guide

## Overview

This system allows administrators to dynamically configure and modify workflow conditions for exclusive gateways in BPMN workflows without needing to edit the BPMN XML directly. Conditions are stored in the database and applied at runtime.

## Features

### 1. **Admin-Configurable Conditions**
- Set custom conditions for any exclusive gateway
- Modify conditions without redeploying workflows
- Store conditions in database for persistence
- Version control for conditions

### 2. **Dynamic Application**
- Conditions are applied automatically during deployment
- No need to manually edit BPMN XML
- Real-time condition updates
- Fallback to original conditions if dynamic ones fail

### 3. **User-Friendly Interface**
- Web-based condition management
- Visual condition editor
- Helpful examples and documentation
- Bulk operations support

## How It Works

### **Backend Architecture**

```
WorkflowCondition Entity
├── gatewayId: String (ID of the exclusive gateway)
├── flowId: String (ID of the sequence flow)
├── conditionExpression: String (Flowable expression)
├── conditionName: String (Human-readable name)
├── description: String (Optional description)
├── isActive: Boolean (Whether condition is active)
└── timestamps (created, updated)
```

### **Frontend Components**

1. **WorkflowConditionsComponent** - Main management interface
2. **WorkflowConditionService** - Service for API communication
3. **BPMN Editor Integration** - Automatic condition application

### **API Endpoints**

- `GET /api/workflow-conditions/gateway/{gatewayId}` - Get conditions for a gateway
- `GET /api/workflow-conditions/gateways` - Get all gateway IDs
- `POST /api/workflow-conditions` - Create new condition
- `PUT /api/workflow-conditions/{id}` - Update existing condition
- `DELETE /api/workflow-conditions/{id}` - Deactivate condition
- `POST /api/workflow-conditions/initialize-defaults` - Create default conditions

## Usage Instructions

### **1. Accessing the Interface**

Navigate to `/workflow-conditions` in your admin dashboard, or click on "Conditions" in the sidebar.

### **2. Initializing Default Conditions**

1. Click "Initialize Defaults" button
2. This creates the default conditions for your CV Score Decision gateway:
   - **Flow_3**: `${cvScore >= 3}` → Send Challenge
   - **Flow_4**: `${cvScore < 3}` → Reject Candidature

### **3. Creating Custom Conditions**

1. Click "Add Condition" button
2. Fill in the form:
   - **Gateway ID**: The ID of your exclusive gateway (e.g., `CV_Score_Decision`)
   - **Flow ID**: The ID of the sequence flow (e.g., `Flow_3`, `Flow_4`)
   - **Condition Expression**: The Flowable expression (e.g., `${cvScore >= 5}`)
   - **Condition Name**: Human-readable name (e.g., "High Score - Send Challenge")
   - **Description**: Optional explanation

3. Click "Create Condition"

### **4. Modifying Existing Conditions**

1. Click the edit button (pencil icon) on any condition
2. Modify the values as needed
3. Click "Update Condition"

### **5. Deactivating Conditions**

1. Click the delete button (trash icon) on any condition
2. Confirm the deletion
3. The condition is marked as inactive (soft delete)

## Condition Expression Examples

### **Basic Comparisons**
```javascript
${cvScore >= 3}           // CV score is 3 or higher
${cvScore < 3}            // CV score is less than 3
${experience >= 5}        // Experience is 5 years or more
${age <= 35}              // Age is 35 or younger
```

### **String Comparisons**
```javascript
${status == 'APPROVED'}   // Status equals 'APPROVED'
${department == 'IT'}      // Department equals 'IT'
${level != 'JUNIOR'}      // Level is not 'JUNIOR'
```

### **Multiple Conditions**
```javascript
${cvScore >= 3 && experience >= 2}           // AND operator
${cvScore >= 4 || hasCertification == true}  // OR operator
${!(cvScore < 2)}                            // NOT operator
```

### **Variable Access**
```javascript
${candidate.skills.contains('Java')}         // Object property access
${offre.requiredLevel == candidate.level}    // Multiple variables
${candidature.status == 'PENDING'}           // Entity properties
```

## Integration with BPMN Editor

### **Automatic Condition Application**

1. **During Deployment**: When you deploy a workflow, the system automatically applies the stored conditions
2. **Condition Extraction**: Use the "Extract Conditions" button to parse existing BPMN XML and save conditions
3. **Real-time Updates**: Conditions are applied before sending to Flowable

### **Workflow**

```
1. Design BPMN workflow in editor
2. Set up exclusive gateways with basic conditions
3. Use "Extract Conditions" to save current conditions
4. Modify conditions in the conditions interface
5. Deploy workflow (conditions applied automatically)
6. Workflow runs with dynamic conditions
```

## Best Practices

### **1. Naming Conventions**
- Use descriptive condition names
- Include the outcome in the name (e.g., "High Score - Send Challenge")
- Use consistent naming patterns

### **2. Expression Design**
- Keep expressions simple and readable
- Use meaningful variable names
- Test expressions with sample data
- Document complex expressions

### **3. Gateway Organization**
- Use descriptive gateway IDs
- Group related conditions together
- Document gateway purposes

### **4. Testing**
- Test conditions with various data scenarios
- Verify workflow paths are correct
- Monitor workflow execution logs

## Troubleshooting

### **Common Issues**

1. **Conditions Not Applied**
   - Check if conditions are marked as active
   - Verify gateway and flow IDs match BPMN
   - Check browser console for errors

2. **Invalid Expressions**
   - Ensure proper Flowable syntax
   - Check variable names exist in workflow
   - Validate expression logic

3. **Deployment Failures**
   - Check BPMN XML validity
   - Verify all required delegates are assigned
   - Check backend logs for errors

### **Debug Steps**

1. **Check Condition Status**: Verify conditions are active in the interface
2. **Validate BPMN**: Use the BPMN editor's validation
3. **Check Logs**: Review backend application logs
4. **Test Expressions**: Use simple test cases first

## Advanced Features

### **1. Condition Versioning**
- Track condition changes over time
- Rollback to previous versions
- Audit trail for compliance

### **2. Bulk Operations**
- Import/export conditions
- Batch condition updates
- Template-based condition creation

### **3. Advanced Expressions**
- Complex mathematical operations
- Date/time comparisons
- Array and collection operations
- Custom function calls

### **4. Workflow Analytics**
- Track condition evaluation results
- Performance metrics
- Decision path analysis

## Security Considerations

### **1. Access Control**
- Admin-only access to condition management
- Role-based permissions
- Audit logging for changes

### **2. Input Validation**
- Sanitize condition expressions
- Prevent injection attacks
- Validate expression syntax

### **3. Data Protection**
- Encrypt sensitive condition data
- Secure API endpoints
- Regular security audits

## Future Enhancements

### **1. Visual Condition Builder**
- Drag-and-drop condition creation
- Visual expression editor
- Template library

### **2. Machine Learning Integration**
- Automatic condition optimization
- Pattern recognition
- Predictive condition suggestions

### **3. Advanced Workflow Types**
- Support for parallel gateways
- Inclusive gateway conditions
- Event-based conditions

### **4. Real-time Monitoring**
- Live condition evaluation
- Performance metrics
- Alert system for failures

## Conclusion

The dynamic workflow conditions system provides a powerful and flexible way to manage workflow logic without the complexity of direct BPMN XML editing. By separating condition logic from workflow structure, administrators can easily modify business rules while maintaining workflow integrity.

This system is particularly valuable for:
- **Business Analysts**: Easy condition modification without technical knowledge
- **Developers**: Reduced need for workflow redeployment
- **Operations Teams**: Quick response to changing business requirements
- **Compliance**: Audit trail for all condition changes

For support or questions, refer to the system logs or contact the development team.
