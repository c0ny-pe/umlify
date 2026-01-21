import { Dispatch, SetStateAction } from "react";
import UMLNode, {
  Visibility,
  type CustomNodeData,
  type FieldType,
} from "../../model/UMLNode";
import {
  Accordion,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

type NodeFieldsProps = {
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
    drawVisibility,
    expanded,
    handlePanelChange,
    editMode,
    forceUpdate,
    setExpanded,
  } = props;

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
              startIcon={<AddIcon fontSize="small" />}
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
                        expandIcon={<ArrowDownwardIcon fontSize="small" />}
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
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </Box>

                  <AccordionDetails>
                    <div className="two-cols-container">
                      <TextField
                        id={`field-${i}-name`}
                        label="Field Name"
                        variant="standard"
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

                      <TextField
                        id={`field-${i}-type`}
                        label="Field Type"
                        variant="standard"
                        defaultValue={field.type}
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
                              type: e.target.value,
                            });
                            return [...oldNodes];
                          });
                          forceUpdate();
                        }}
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
