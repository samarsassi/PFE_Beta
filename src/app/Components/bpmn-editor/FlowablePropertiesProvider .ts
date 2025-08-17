// Define a custom interface for the properties panel entry
interface PropertiesPanelEntry {
  id: string;
  label: string;
  html: string;
  get: (element: any) => { [key: string]: any };
  set: (element: any, values: { [key: string]: any }) => void;
}

function FlowablePropertiesProvider(
  this: { getTabs: (element: any) => any[] },
  eventBus: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: any
) {
  this.getTabs = (element: any) => {
    if (element.type !== "bpmn:UserTask") return [];

    return [
      {
        id: "flowable",
        label: "Flowable",
        groups: [
          {
            id: "flowableProperties",
            label: "Properties",
            entries: [
              {
                id: "assignee",
                label: "Assignee",
                html: `<input id="assignee"/>`,
                get: (el: any) => ({ assignee: el.businessObject.get("flowable:assignee") || "" }),
                set: (el: any, values: { [key: string]: any }) => {
                  const assignee = typeof values['assignee'] === "string" ? values['assignee'] : undefined;
                  el.businessObject.set("flowable:assignee", assignee);
                },
              } as PropertiesPanelEntry,
            ],
          },
        ],
      },
    ];
  };
}

FlowablePropertiesProvider.$inject = ["eventBus", "bpmnFactory", "elementRegistry", "translate"];

export default {
  __init__: ["flowablePropertiesProvider"],
  flowablePropertiesProvider: ["type", FlowablePropertiesProvider],
};