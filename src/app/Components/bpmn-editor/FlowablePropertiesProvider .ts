import { is } from 'bpmn-js/lib/util/ModelUtil';

interface PropertiesPanelEntry {
  id: string;
  label: string;
  html: string;
  get: (element: any) => { [key: string]: any };
  set: (element: any, values: { [key: string]: any }) => { [key: string]: any };
  validate?: (element: any, values: { [key: string]: any }) => { [key: string]: any };
}

function FlowablePropertiesProvider(
  this: { getTabs: (element: any) => any[] },
  eventBus: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: any,
  propertiesProvider: any // Inject default properties provider
) {
  this.getTabs = (element: any) => {
    console.log('Generating tabs for element:', element); // Debug log
    const defaultTabs = propertiesProvider.getTabs(element) || []; // Get default tabs

    // UserTask properties
    if (is(element, 'bpmn:UserTask')) {
      console.log('Detected UserTask, adding Flowable tab');
      defaultTabs.push({
        id: 'flowable',
        label: 'Flowable',
        groups: [
          {
            id: 'flowableProperties',
            label: 'Properties',
            entries: [
              {
                id: 'assignee',
                label: 'Assignee',
                html: `<input id="assignee" type="text" name="assignee" />`,
                get: (el: any) => ({ assignee: el.businessObject.get('flowable:assignee') || '' }),
                set: (el: any, values: { [key: string]: any }) => {
                  const assignee = typeof values['assignee'] === 'string' ? values['assignee'] : undefined;
                  return { 'flowable:assignee': assignee };
                },
              } as PropertiesPanelEntry,
            ],
          },
        ],
      });
    }

    // SequenceFlow properties
    if (is(element, 'bpmn:SequenceFlow')) {
      console.log('Detected SequenceFlow, adding Flowable Conditions tab');
      defaultTabs.push({
        id: 'flowableSequenceFlow',
        label: 'Flowable Conditions',
        groups: [
          {
            id: 'conditionProperties',
            label: 'Condition',
            entries: [
              {
                id: 'flowableConditionExpression',
                label: 'Condition Expression',
                html: `<input id="flowableConditionExpression" type="text" name="flowableConditionExpression" />`,
                get: (el: any) => {
                  console.log('Getting flowableConditionExpression for:', el.businessObject);
                  const conditionExpression = el.businessObject.get('flowable:flowableConditionExpression');
                  return {
                    flowableConditionExpression: conditionExpression ? conditionExpression.body : '',
                  };
                },
                set: (el: any, values: { [key: string]: any }) => {
                  console.log('Setting flowableConditionExpression to:', values['flowableConditionExpression']);
                  const conditionExpression = values['flowableConditionExpression'];
                  return {
                    'flowable:flowableConditionExpression': conditionExpression
                      ? bpmnFactory.create('bpmn:FormalExpression', { body: conditionExpression })
                      : undefined,
                  };
                },
                validate: (el: any, values: { [key: string]: any }) => {
                  console.log('Validating flowableConditionExpression:', values['flowableConditionExpression']);
                  if (!values['flowableConditionExpression']) {
                    return { flowableConditionExpression: 'Must provide a value' };
                  }
                  if (!/^\${.*}$/.test(values['flowableConditionExpression'])) {
                    return { flowableConditionExpression: 'Condition must be a valid Flowable expression (e.g., ${variable == true})' };
                  }
                  return {};
                },
              } as PropertiesPanelEntry,
            ],
          },
        ],
      });
    }

    console.log('Returning tabs:', defaultTabs); // Debug log
    return defaultTabs;
  };
}

FlowablePropertiesProvider.$inject = ['eventBus', 'bpmnFactory', 'elementRegistry', 'translate', 'propertiesProvider'];

export default {
  __init__: ['flowablePropertiesProvider'],
  flowablePropertiesProvider: ['type', FlowablePropertiesProvider],
};