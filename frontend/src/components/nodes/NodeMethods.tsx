import { Dispatch, SetStateAction, useMemo } from "react";
import UMLNode, {
  CustomNodeData,
  MethodType,
  Type,
  Visibility,
} from "../../model/UMLNode";
import { SCALA_SIMPLE_TYPE_LIST } from "../../utils/scalaFieldType";
import {
  Accordion,
  AccordionSummary,
  Button,
  Box,
  Typography,
  IconButton,
  AccordionDetails,
  TextField,
  Autocomplete,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from "@mui/material";

import { ChevronDown, Plus, Trash2 } from "lucide-react";

type NodeMethodsProps = {
  data: CustomNodeData;
  setNodes: Dispatch<SetStateAction<UMLNode[]>>;
  drawVisibility: (visibility: Visibility | null) => string;
  expanded: string | false;
  handlePanelChange: (
    panel: string
  ) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  editMode: boolean;
  forceUpdate: () => void;
  setExpanded: (x: string | false) => void;
  allowedTypeNames: string[];
};

const DEFAULT_NEW_METHOD: MethodType = {
  name: "methodName",
  domType: [],
  codType: "",
  visibility: "public",
  abstract: false,
};

/** El nombre lo pone la clase al agregarlo. */
const DEFAULT_NEW_CONSTRUCTOR: MethodType = {
  name: "",
  domType: [],
  codType: "",
  visibility: "public",
  abstract: false,
};

const NodeMethods = (props: NodeMethodsProps) => {
  const {
    data,
    setNodes,
    drawVisibility,
    expanded,
    handlePanelChange,
    editMode,
    forceUpdate,
    setExpanded,
    allowedTypeNames,
  } = props;

  const methodTypeOptions = useMemo(() => {
    const dynamicClassTypes = allowedTypeNames
      .map((name) => name.trim())
      .filter(Boolean);

    return Array.from(
      new Set([...SCALA_SIMPLE_TYPE_LIST, ...dynamicClassTypes])
    ).sort((a, b) => a.localeCompare(b));
  }, [allowedTypeNames]);

  // Un método que se llama igual que su clase es un constructor: en UML se
  // dibuja sin tipo de retorno.
  const isConstructor = (method: MethodType): boolean =>
    method.name.trim() === data.name.trim();

  const drawSignature = (method: MethodType): string =>
    `${method.name}(${method.domType.join(", ")})${
      isConstructor(method) ? "" : `: ${method.codType ? method.codType : "Unit"}`
    }`;

  return (
    <>
      <div className="method-container">
        {!editMode ? (
          data.methods.map((method: MethodType, id: number) => {
            return (
              <p
                key={`method-${method.name}-${id}`}
                style={{
                  ...(method.abstract ? { fontStyle: "italic" } : {}),
                  ...(isConstructor(method) ? { textDecoration: "underline" } : {}),
                }}
              >
                {drawVisibility(method.visibility)} {drawSignature(method)}
              </p>
            );
          })
        ) : (
          <>
            <Button
              size="small"
              onClick={() => {
                setNodes((oldNodes) => {
                  return oldNodes.map((node: UMLNode) => {
                    if (node.id === data.id) {
                      node.addMethod({ ...DEFAULT_NEW_METHOD });
                    }

                    return node;
                  });
                });
                setExpanded(`panel-methods${data.methods.length - 1}`);
                forceUpdate();
              }}
              variant="text"
              startIcon={<Plus size={16} strokeWidth={2} />}
            >
              Add method
            </Button>

            <Button
              size="small"
              onClick={() => {
                setNodes((oldNodes) => {
                  return oldNodes.map((node: UMLNode) => {
                    if (node.id === data.id) {
                      // El nombre de un constructor es el de su clase: solo
                      // quedan por definir los parámetros.
                      node.addMethod({ ...DEFAULT_NEW_CONSTRUCTOR, name: data.name });
                    }

                    return node;
                  });
                });
                setExpanded(`panel-methods${data.methods.length - 1}`);
                forceUpdate();
              }}
              variant="text"
              startIcon={<Plus size={16} strokeWidth={2} />}
            >
              Add constructor
            </Button>

            {data.methods.map((method: MethodType, i: number) => {
              return (
                <Accordion
                  key={`accordion-method-${i}`}
                  expanded={expanded === `panel-methods${i}`}
                  onChange={handlePanelChange(`panel-methods${i}`)}
                >
                  <Box sx={{ display: "flex", minWidth: "100%" }}>
                    <div style={{ width: "100%" }}>
                      <AccordionSummary
                        expandIcon={<ChevronDown size={16} strokeWidth={2} />}
                        aria-controls={`panel-methods-${i}-content`}
                        id={`panel-methods-${i}-header`}
                      >
                        <Typography
                          sx={isConstructor(method) ? { textDecoration: "underline" } : undefined}
                        >
                          {drawVisibility(method.visibility)} {drawSignature(method)}
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
                            retrievedNode.removeMethodAt(i);
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
                    {isConstructor(method) ? (
                      <TextField
                        size="small"
                        id={`method-${i}-name`}
                        label="Constructor"
                        variant="standard"
                        value={data.name}
                        disabled
                        helperText="Toma el nombre de la clase"
                        InputLabelProps={{ shrink: true }}
                        sx={{ marginBottom: "12px" }}
                      />
                    ) : (
                      <div className="two-cols-container">
                        <TextField
                          size="small"
                          id={`method-${i}-name`}
                          label="Method Name"
                          variant="standard"
                          defaultValue={method.name}
                          InputLabelProps={{ shrink: true }}
                          onChange={(e) => {
                            setNodes((oldNodes) => {
                              const [retrievedNode] = oldNodes.filter(
                                (n: UMLNode) => n.id === data.id
                              );
                              retrievedNode.updateMethodAt(i, {
                                ...method,
                                name: e.target.value,
                              });
                              return [...oldNodes];
                            });
                            forceUpdate();
                          }}
                        />

                        <Autocomplete
                          freeSolo
                          options={methodTypeOptions}
                          openOnFocus
                          sx={{ width: "100%" }}
                          inputValue={method.codType ?? ""}
                          onInputChange={(_event, nextValue) => {
                            setNodes((oldNodes) => {
                              const [retrievedNode] = oldNodes.filter(
                                (n: UMLNode) => n.id === data.id
                              );
                              retrievedNode.updateMethodAt(i, {
                                ...method,
                                codType: nextValue,
                              });
                              return [...oldNodes];
                            });
                            forceUpdate();
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              id={`method-${i}-codType`}
                              label="Method Codomain Type"
                              variant="standard"
                              InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                            />
                          )}
                        />
                      </div>
                    )}

                    <Autocomplete
                      size="small"
                      sx={{ maxWidth: "inherit", marginBottom: "20px" }}
                      multiple
                      id="method-tags-standard"
                      options={methodTypeOptions}
                      value={method.domType}
                      freeSolo
                      openOnFocus
                      // Allows to insert a value more than one time
                      isOptionEqualToValue={() => false}
                      limitTags={2}
                      onChange={(_, newValue: readonly string[]) => {
                        if (newValue && newValue.length >= 0) {
                          setNodes((oldNodes) => {
                            const [retrievedNode] = oldNodes.filter(
                              (n: UMLNode) => n.id === data.id
                            );
                            // As newValue is read-only, we pass an array copy
                            const newDomType: Type[] = [...newValue];
                            retrievedNode.updateMethodAt(i, {
                              ...method,
                              domType: newDomType,
                            });
                            return [...oldNodes];
                          });
                          forceUpdate();
                        }
                      }}
                      renderTags={(value: readonly string[], getTagProps) =>
                        value.map((option: string, index: number) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={option}
                              key={key}
                              {...tagProps}
                            />
                          );
                        })
                      }
                      renderInput={(params) => {
                        return (
                          <TextField
                            {...params}
                            size="small"
                            variant="standard"
                            label="Method Domain Type(s)"
                            placeholder="Type and press Enter"
                            InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                          />
                        );
                      }}
                    />

                    <div
                      className="two-cols-container"
                      style={{ marginBottom: 0 }}
                    >
                      <FormControl
                        size="small"
                        fullWidth
                        variant="standard"
                        sx={{ mt: 1.5 }}
                        className="nodrag"
                        onMouseDown={(e) => e.nativeEvent.stopPropagation()}
                      >
                        <InputLabel size="small" id={`method-${i}-visibility`}>
                          Visibility
                        </InputLabel>
                        <Select
                          size="small"
                          labelId={`method-${i}-visibility`}
                          id={`method-${i}-visibility-select`}
                          sx={{ overflow: "visible", zIndex: 9999 }}
                          value={method.visibility}
                          variant="standard"
                          onChange={(e) => {
                            setNodes((oldNodes) => {
                              const [retrievedNode] = oldNodes.filter(
                                (n: UMLNode) => n.id === data.id
                              );
                              retrievedNode.updateMethodAt(i, {
                                ...method,
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

                      {!isConstructor(method) && (
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={method.abstract}
                                onChange={(_) => {
                                  setNodes((oldNodes) => {
                                    const [retrievedNode] = oldNodes.filter(
                                      (n: UMLNode) => n.id === data.id
                                    );
                                    retrievedNode.updateMethodAt(i, {
                                      ...method,
                                      abstract: !method.abstract,
                                    });
                                    return [...oldNodes];
                                  });
                                  forceUpdate();
                                }}
                              />
                            }
                            label="Abstract?"
                          />
                        </FormGroup>
                      )}
                    </div>
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

export default NodeMethods;
