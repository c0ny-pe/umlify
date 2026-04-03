import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Edge, NodeProps } from "@xyflow/react";
import UMLNode, { CustomNode, CustomNodeData } from "../../model/UMLNode";

import Trait from "../../model/Trait";
import AbstractClass from "../../model/AbstractClass";
import ConcreteClass from "../../model/ConcreteClass";

import {
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import { Delete } from "@mui/icons-material";

type NodeHeaderProps = {
  data: CustomNodeData;
  node: NodeProps<CustomNode>;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  setNodes: Dispatch<SetStateAction<UMLNode[]>>;
  setNodeNames: Dispatch<SetStateAction<string[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  forceUpdate: () => void;
  mouseHover: boolean;
  getUniqueNodeName: (baseName: string, excludedName?: string) => string;
};

const NodeHeader = (props: NodeHeaderProps) => {
  const {
    data,
    node,
    editMode,
    setEditMode,
    setNodes,
    setNodeNames,
    setEdges,
    forceUpdate,
    mouseHover,
    getUniqueNodeName,
  } = props;

  const [nameInput, setNameInput] = useState(data.name);

  useEffect(() => {
    setNameInput(data.name);
  }, [data.name, editMode]);

  return (
    <>
      <div className={`title-container ${node.type}`}>
        {data.additionalText && data.additionalText.length > 0 && (
          <p className="additional-text-paragraph">{data.additionalText}</p>
        )}
        {!editMode ? (
          <p className={data.styleClass}>{data.name}</p>
        ) : (
          <>
            <div className="name-type-edit-container">
              <TextField
                id="class-text-name"
                sx={{ width: "100%" }}
                label="Class Name"
                variant="standard"
                value={nameInput}
                size="small"
                onChange={(e) => {
                  setNameInput(e.target.value);
                }}
                onBlur={() => {
                  const uniqueName = getUniqueNodeName(nameInput, data.name);
                  setNodes((oldNodes) => {
                    const [retrievedNode] = oldNodes.filter(
                      (n: UMLNode) => n.id === data.id
                    );

                    if (!retrievedNode) {
                      return oldNodes;
                    }

                    retrievedNode.updateName(uniqueName);
                    return [...oldNodes];
                  });

                  setNodeNames((oldNames) => {
                    const nextNames = [...oldNames];
                    const currentIndex = nextNames.findIndex(
                      (name) => name === data.name
                    );

                    if (currentIndex !== -1) {
                      nextNames[currentIndex] = uniqueName;
                    }

                    return nextNames;
                  });

                  setNameInput(uniqueName);
                  forceUpdate();
                }}
              />

              <FormControl variant="standard" fullWidth>
                <InputLabel id="input-change-type">Change Type</InputLabel>
                <Select
                  labelId="label-change-type"
                  id="select-change-type"
                  sx={{ overflow: "visible", zIndex: 9999 }}
                  value={node.type}
                  label="Change Type"
                  size="small"
                  onChange={(e) => {
                    if (e.target.value === node.type) return;

                    let newNode: UMLNode | null = null;
                    switch (e.target.value) {
                      case "trait":
                        newNode = new Trait(
                          data.id,
                          data.name,
                          data.methods,
                          data.fields,
                          node.positionAbsoluteX,
                          node.positionAbsoluteY
                        );
                        break;
                      case "abstractClass":
                        newNode = new AbstractClass(
                          data.id,
                          data.name,
                          data.methods,
                          data.fields,
                          node.positionAbsoluteX,
                          node.positionAbsoluteY
                        );
                        break;
                      case "concreteClass":
                        newNode = new ConcreteClass(
                          data.id,
                          data.name,
                          data.methods,
                          data.fields,
                          node.positionAbsoluteX,
                          node.positionAbsoluteY
                        );
                        break;
                    }

                    setNodes((oldNodes) => {
                      const currentIndex = oldNodes.findIndex(
                        (n) => n.id === data.id
                      );
                      // Only proceeds if the node is found
                      if (currentIndex !== -1 && newNode) {
                        oldNodes[currentIndex] = newNode;
                      }

                      return [...oldNodes];
                    });
                    forceUpdate();
                  }}
                >
                  <MenuItem value={"trait"}>Trait</MenuItem>
                  <MenuItem value={"abstractClass"}>Abstract Class</MenuItem>
                  <MenuItem value={"concreteClass"}>Concrete Class</MenuItem>
                </Select>
              </FormControl>
            </div>
          </>
        )}

        <div style={{ position: "absolute", top: 0, right: 0 }}>
          {mouseHover && (
            <>
              {editMode ? (
                <Tooltip placement="top" title="Exit Edit mode" arrow>
                  <IconButton size="small" onClick={() => setEditMode(false)}>
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip placement="top" title="Enter Edit mode" arrow>
                  <IconButton size="small" onClick={() => setEditMode(true)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </div>

        <div style={{ position: "absolute", top: 0, left: 0 }}>
          {mouseHover && (
            <Tooltip placement="top" title="Delete Node" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  // We want to delete all the edges that involves this node.
                  setEdges((oldEdges) => {
                    return oldEdges.filter((edge) => {
                      return (
                        edge.source !== String(data.id) &&
                        edge.target !== String(data.id)
                      );
                    });
                  });

                  setNodes((oldNodes) => {
                    return oldNodes.filter((node) => node.id !== data.id);
                  });

                  setNodeNames((oldNames) => {
                    const currentIndex = oldNames.findIndex(
                      (name) => name === data.name
                    );

                    if (currentIndex === -1) {
                      return oldNames;
                    }

                    return [
                      ...oldNames.slice(0, currentIndex),
                      ...oldNames.slice(currentIndex + 1),
                    ];
                  });
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
};

export default NodeHeader;
