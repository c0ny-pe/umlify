import { Dispatch, SetStateAction } from "react";
import UMLNode, {
  CustomNodeData,
  MethodType,
  Type,
  Visibility,
} from "../../model/UMLNode";
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

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

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
};

const DEFAULT_NEW_METHOD: MethodType = {
  name: "methodName",
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
  } = props;

  return (
    <>
      <div className="method-container">
        {!editMode ? (
          data.methods.map((method: MethodType, id: number) => {
            return (
              <p
                key={`method-${method.name}-${id}`}
                style={method.abstract ? { fontStyle: "italic" } : {}}
              >
                {drawVisibility(method.visibility)} {method.name}
                {"("}
                {method.domType.join(", ")}
                {"): "}
                {method.codType ? method.codType : "Unit"}
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
                      node.addMethod(DEFAULT_NEW_METHOD);
                    }

                    return node;
                  });
                });
                setExpanded(`panel-methods${data.methods.length - 1}`);
                forceUpdate();
              }}
              variant="text"
              startIcon={<AddIcon fontSize="small" />}
            >
              Add method
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
                        expandIcon={<ArrowDownwardIcon fontSize="small" />}
                        aria-controls={`panel-methods-${i}-content`}
                        id={`panel-methods-${i}-header`}
                      >
                        <Typography>
                          {drawVisibility(method.visibility)} {method.name}
                          {"("}
                          {method.domType.join(", ")}
                          {"): "}
                          {method.codType ? method.codType : "Unit"}
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
                            retrievedNode.removeMethod(method);
                            return [...oldNodes];
                          });
                          forceUpdate();
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </Box>

                  <AccordionDetails>
                    <div className="two-cols-container">
                      <TextField
                        size="small"
                        id={`method-${i}-name`}
                        label="Method Name"
                        variant="standard"
                        defaultValue={method.name}
                        onChange={(e) => {
                          setNodes((oldNodes) => {
                            const [retrievedNode] = oldNodes.filter(
                              (n: UMLNode) => n.id === data.id
                            );
                            const methodToUpdate = data.methods.find(
                              (m) => m.name === method.name
                            );

                            if (!methodToUpdate) {
                              return oldNodes;
                            }

                            retrievedNode.updateMethod(methodToUpdate, {
                              ...methodToUpdate,
                              name: e.target.value,
                            });
                            return [...oldNodes];
                          });
                          forceUpdate();
                        }}
                      />

                      <TextField
                        size="small"
                        id={`method-${i}-codType`}
                        label="Method Codomain Type"
                        variant="standard"
                        defaultValue={method.codType}
                        onChange={(e) => {
                          setNodes((oldNodes) => {
                            const [retrievedNode] = oldNodes.filter(
                              (n: UMLNode) => n.id === data.id
                            );
                            const methodToUpdate = data.methods.find(
                              (m) => m.name === method.name
                            );

                            if (!methodToUpdate) {
                              return oldNodes;
                            }

                            retrievedNode.updateMethod(methodToUpdate, {
                              ...methodToUpdate,
                              codType: e.target.value,
                            });
                            return [...oldNodes];
                          });
                          forceUpdate();
                        }}
                      />
                    </div>

                    <Autocomplete
                      size="small"
                      sx={{ maxWidth: "inherit", marginBottom: "20px" }}
                      multiple
                      id="method-tags-standard"
                      options={[]}
                      value={method.domType}
                      freeSolo
                      // Allows to insert a value more than one time
                      isOptionEqualToValue={() => false}
                      limitTags={2}
                      onChange={(_, newValue: readonly string[]) => {
                        if (newValue && newValue.length >= 0) {
                          setNodes((oldNodes) => {
                            const [retrievedNode] = oldNodes.filter(
                              (n: UMLNode) => n.id === data.id
                            );
                            const methodToUpdate = data.methods.find(
                              (m) => m.name === method.name
                            );

                            if (!methodToUpdate) {
                              return oldNodes;
                            }

                            // As newValue is read-only, we pass an array copy
                            const newDomType: Type[] = [...newValue];
                            retrievedNode.updateMethod(methodToUpdate, {
                              ...methodToUpdate,
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
                          />
                        );
                      }}
                    />

                    <div
                      className="two-cols-container"
                      style={{ marginBottom: 0 }}
                    >
                      <FormControl size="small" fullWidth>
                        <InputLabel size="small" id={`method-${i}-visibility`}>
                          Visibility
                        </InputLabel>
                        <Select
                          size="small"
                          labelId={`method-${i}-visibility`}
                          id={`method-${i}-visibility-select`}
                          sx={{ overflow: "visible", zIndex: 9999 }}
                          value={method.visibility}
                          label="Visibility"
                          onChange={(e) => {
                            setNodes((oldNodes) => {
                              const [retrievedNode] = oldNodes.filter(
                                (n: UMLNode) => n.id === data.id
                              );
                              const methodToUpdate = data.methods.find(
                                (m) => m.name === method.name
                              );

                              if (!methodToUpdate) {
                                return oldNodes;
                              }

                              retrievedNode.updateMethod(methodToUpdate, {
                                ...methodToUpdate,
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
                                  const methodToUpdate = data.methods.find(
                                    (m) => m.name === method.name
                                  );

                                  if (!methodToUpdate) {
                                    return oldNodes;
                                  }

                                  retrievedNode.updateMethod(methodToUpdate, {
                                    ...methodToUpdate,
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
