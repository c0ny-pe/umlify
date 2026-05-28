import { Dispatch, SetStateAction, useMemo, useState } from "react";
import UMLNode, {
  Visibility,
  type CustomNodeData,
  type FieldType,
} from "../../model/UMLNode";
import {
  SCALA_SIMPLE_TYPE_LIST,
} from "../../utils/scalaFieldType";
import {
  Accordion,
  Autocomplete,
  AccordionDetails,
  AccordionSummary,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

type NodeFieldsProps = {
  data: CustomNodeData;
  setNodes: Dispatch<SetStateAction<UMLNode[]>>;
  allowedTypeNames: string[];
  drawVisibility: (visibility: Visibility | null) => string;
  expanded: string | false;
  handlePanelChange: (
    panel: string
  ) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  editMode: boolean;
  forceUpdate: () => void;
  setExpanded: (x: string | false) => void;
};

/** Default field when adding a new one */
const DEFAULT_NEW_FIELD: FieldType = {
  name: "fieldName",
  type: "",
  visibility: "public",
};

const NodeFields = (props: NodeFieldsProps) => {
  const {
    data,
    setNodes,
    allowedTypeNames,
    drawVisibility,
    expanded,
    handlePanelChange,
    editMode,
    forceUpdate,
    setExpanded,
  } = props;

  const [fieldTypeDrafts, setFieldTypeDrafts] = useState<Record<string, string>>(
    {}
  );

  const getFieldKey = (field: FieldType, index: number): string => {
    return `${field.name}-${index}`;
  };

  const fieldTypeOptions = useMemo(() => {
    const dynamicClassTypes = allowedTypeNames
      .map((name) => name.trim())
      .filter(Boolean);

    return Array.from(
      new Set([...SCALA_SIMPLE_TYPE_LIST, ...dynamicClassTypes])
    ).sort((a, b) => a.localeCompare(b));
  }, [allowedTypeNames]);

  return (
    <>
      <div className="field-container">
        {!editMode ? (
          data.fields.map((field: FieldType, id: number) => (
            <p key={`field-${field.name}-${id}`}>
              {drawVisibility(field.visibility)} {field.name}: {field.type}
            </p>
          ))
        ) : (
          <>
            <Button
              size="small"
              onClick={() => {
                setNodes((oldNodes) => {
                  return oldNodes.map((node: UMLNode) => {
                    if (node.id === data.id) {
                      node.addField(DEFAULT_NEW_FIELD);
                    }
                    return node;
                  });
                });
                setExpanded(`panel-fields${data.fields.length - 1}`);
                forceUpdate();
              }}
              variant="text"
              startIcon={<Plus size={16} strokeWidth={2} />}
            >
              Add field
            </Button>

            {data.fields.map((field: FieldType, i: number) => {
              return (
                <Accordion
                  key={`accordion-field-${i}`}
                  expanded={expanded === `panel-fields${i}`}
                  onChange={handlePanelChange(`panel-fields${i}`)}
                >
                  <Box sx={{ display: "flex", minWidth: "100%" }}>
                    <div style={{ width: "100%" }}>
                      <AccordionSummary
                        expandIcon={<ChevronDown size={16} strokeWidth={2} />}
                        aria-controls={`panel-fields-${i}-content`}
                        id={`panel-fields-${i}-header`}
                      >
                        <Typography>
                          {drawVisibility(field.visibility)} {field.name}:{" "}
                          {field.type}
                        </Typography>
                      </AccordionSummary>
                    </div>

                    <div
                      style={{ width: "fit-content", alignContent: "center" }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => {
                          setNodes((oldNodes) => {
                            const [retrievedNode] = oldNodes.filter(
                              (n: UMLNode) => n.id === data.id
                            );
                            retrievedNode.removeField(field);
                            return [...oldNodes];
                          });
                          forceUpdate();
                        }}
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </IconButton>
                    </div>
                  </Box>

                  <AccordionDetails>
                    <div className="two-cols-container">
                      <TextField
                        id={`field-${i}-name`}
                        label="Field Name"
                        variant="standard"
                        fullWidth
                        sx={{ flex: 1, minWidth: 0 }}
                        defaultValue={field.name}
                        size="small"
                        onChange={(e) => {
                          setNodes((oldNodes) => {
                            const [retrievedNode] = oldNodes.filter(
                              (n: UMLNode) => n.id === data.id
                            );
                            const fieldToUpdate = data.fields.find(
                              (f) => f.name === field.name
                            );

                            if (!fieldToUpdate) {
                              return oldNodes;
                            }

                            retrievedNode.updateField(fieldToUpdate, {
                              ...fieldToUpdate,
                              name: e.target.value,
                            });
                            return [...oldNodes];
                          });
                          forceUpdate();
                        }}
                      />

                      <Autocomplete
                        freeSolo
                        options={fieldTypeOptions}
                        openOnFocus
                        sx={{ flex: 1, minWidth: 0 }}
                        inputValue={fieldTypeDrafts[getFieldKey(field, i)] ?? field.type}
                        onInputChange={(_event, nextValue) => {
                          const fieldKey = getFieldKey(field, i);
                          setFieldTypeDrafts((oldDrafts) => ({
                            ...oldDrafts,
                            [fieldKey]: nextValue,
                          }));

                          setNodes((oldNodes) => {
                            const [retrievedNode] = oldNodes.filter(
                              (n: UMLNode) => n.id === data.id
                            );
                            const fieldToUpdate = data.fields.find(
                              (f) => f.name === field.name
                            );

                            if (!fieldToUpdate) {
                              return oldNodes;
                            }

                            retrievedNode.updateField(fieldToUpdate, {
                              ...fieldToUpdate,
                              type: nextValue,
                            });
                            return [...oldNodes];
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            id={`field-${i}-type`}
                            label="Field Type"
                            variant="standard"
                            fullWidth
                            size="small"
                            onBlur={() => {
                              const fieldKey = getFieldKey(field, i);
                              const draftValue =
                                fieldTypeDrafts[fieldKey] !== undefined
                                  ? fieldTypeDrafts[fieldKey]
                                  : field.type;
                              const normalizedType = draftValue.trim();

                              setFieldTypeDrafts((oldDrafts) => ({
                                ...oldDrafts,
                                [fieldKey]: normalizedType,
                              }));

                              setNodes((oldNodes) => {
                                const [retrievedNode] = oldNodes.filter(
                                  (n: UMLNode) => n.id === data.id
                                );
                                const fieldToUpdate = data.fields.find(
                                  (f) => f.name === field.name
                                );

                                if (!fieldToUpdate) {
                                  return oldNodes;
                                }

                                retrievedNode.updateField(fieldToUpdate, {
                                  ...fieldToUpdate,
                                  type: normalizedType,
                                });
                                return [...oldNodes];
                              });
                              forceUpdate();
                            }}
                          />
                        )}
                      />
                    </div>

                    <FormControl fullWidth>
                      <InputLabel id={`field-${i}-visibility`}>
                        Visibility
                      </InputLabel>
                      <Select
                        labelId={`field-${i}-visibility`}
                        id={`field-${i}-visibility-select`}
                        sx={{ overflow: "visible", zIndex: 9999 }}
                        value={field.visibility}
                        label="Visibility"
                        size="small"
                        onChange={(e) => {
                          setNodes((oldNodes) => {
                            const [retrievedNode] = oldNodes.filter(
                              (n: UMLNode) => n.id === data.id
                            );
                            const fieldToUpdate = data.fields.find(
                              (f) => f.name === field.name
                            );

                            if (!fieldToUpdate) {
                              return oldNodes;
                            }

                            retrievedNode.updateField(fieldToUpdate, {
                              ...fieldToUpdate,
                              visibility: e.target.value as Visibility,
                            });
                            return [...oldNodes];
                          });
                          forceUpdate();
                        }}
                      >
                        <MenuItem value={"public"}>Public</MenuItem>
                        <MenuItem value={"protected"}>Protected</MenuItem>
                        <MenuItem value={"private"}>Private</MenuItem>
                      </Select>
                    </FormControl>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </>
        )}
      </div>
    </>
  );
};

export default NodeFields;
