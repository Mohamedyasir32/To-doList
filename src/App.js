import { useState } from "react";
import "./App.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function App() {
  const topics = [
    "Work", "Study", "Exercise", "Shopping", "Cooking", "Cleaning",
    "Travel", "Health", "Family", "Finance", "Project", "Entertainment",
    "Reading", "Social", "Event", "Appointment", "Personal", "Goal",
    "Learning", "Other",
  ];

  const [topic, setTopic] = useState("");
  const [desc, setDesc] = useState("");
  const [listType, setListType] = useState("listA");
  const [todos, setTodos] = useState({});
  const [topicOrder, setTopicOrder] = useState([]);

  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState([]); // ✅ NEW: Track which topics are expanded

  const addTask = () => {
    if (topic.trim() === "" || desc.trim() === "") return;
    const newTask = {
      id: Date.now().toString(),
      title: topic,
      description: desc,
      completed: false,
    };

    setTodos((prev) => {
      const newTodos = {
        ...prev,
        [topic]: {
          listA: prev[topic]?.listA || [],
          listB: prev[topic]?.listB || [],
          [listType]: [...(prev[topic]?.[listType] || []), newTask],
        },
      };

      if (!topicOrder.includes(topic)) {
        setTopicOrder([...topicOrder, topic]);
      }

      return newTodos;
    });

    setDesc("");
  };

  const toggleComplete = (topic, list, id) => {
    setTodos((prev) => ({
      ...prev,
      [topic]: {
        ...prev[topic],
        [list]: prev[topic][list].map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        ),
      },
    }));
  };

  const deleteTask = (topic, list, id) => {
    setTodos((prev) => ({
      ...prev,
      [topic]: {
        ...prev[topic],
        [list]: prev[topic][list].filter((t) => t.id !== id),
      },
    }));
  };

  const deleteList = (topic, list) => {
    if (window.confirm(`Delete all tasks in ${list === "listA" ? "List A" : "List B"} under ${topic}?`)) {
      setTodos((prev) => ({
        ...prev,
        [topic]: { ...prev[topic], [list]: [] },
      }));
    }
  };

  const deleteTopic = (topicKey) => {
    if (window.confirm(`If you want to delete "${topicKey}" (List A & List B)?`)) {
      setTodos((prev) => {
        const updated = { ...prev };
        delete updated[topicKey];
        return updated;
      });
      setTopicOrder((prev) => prev.filter((t) => t !== topicKey));
      setExpandedTopics((prev) => prev.filter((t) => t !== topicKey)); // ✅ collapse if deleted
    }
  };

  const startEditing = (todo) => {
    setEditId(todo.id);
    setEditTitle(todo.title);
    setEditDesc(todo.description || "");
  };

  const saveEdit = (topic, list, id) => {
    if (editTitle.trim() === "") return;
    setTodos((prev) => ({
      ...prev,
      [topic]: {
        ...prev[topic],
        [list]: prev[topic][list].map((t) =>
          t.id === id ? { ...t, title: editTitle, description: editDesc } : t
        ),
      },
    }));
    setEditId(null);
    setEditTitle("");
    setEditDesc("");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditDesc("");
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // ✅ NEW: Toggle expand/collapse for topic lists
  const toggleTopicExpand = (topicKey) => {
    setExpandedTopics((prev) =>
      prev.includes(topicKey)
        ? prev.filter((t) => t !== topicKey)
        : [...prev, topicKey]
    );
  };

  const handleTaskDragEnd = (result, topic, listType) => {
    if (!result.destination) return;
    const items = Array.from(todos[topic][listType]);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTodos((prev) => ({
      ...prev,
      [topic]: { ...prev[topic], [listType]: items },
    }));
  };

  const handleTopicDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(topicOrder);
    const [movedTopic] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, movedTopic);
    setTopicOrder(reordered);
  };

  return (
    <div className="container">
      <h1>📋 Add Your Task</h1>

      <div className="input-section">
        <select className="dropdown" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">Select topic...</option>
          {topics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select className="dropdown" value={listType} onChange={(e) => setListType(e.target.value)}>
          <option value="listA">🗒️ List A</option>
          <option value="listB">📘 List B</option>
        </select>

        <input
          type="description"
          placeholder="Enter task description..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button onClick={addTask}>+</button>
      </div>

      <DragDropContext onDragEnd={handleTopicDragEnd}>
        <Droppable droppableId="topics-droppable">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {topicOrder.map((topicKey, index) => (
                <Draggable key={topicKey} draggableId={topicKey} index={index}>
                  {(provided) => (
                    <div  ref={provided.innerRef} {...provided.draggableProps} className="topic-section">
                      <div className="topic-header" {...provided.dragHandleProps}>
                        <h2 onClick={() => toggleTopicExpand(topicKey)} style={{ cursor: "pointer" }}>{expandedTopics.includes(topicKey) ? "▼ " : "▶ "} {topicKey} </h2>
                        <button className="delete-topic-btn" onClick={() => deleteTopic(topicKey)}>🗑️ Delete Topic </button>
                      </div>

                      {expandedTopics.includes(topicKey) && ( 
                        <>
                          {["listA", "listB"].map((list) => (
                            <div key={list} className="list-section">
                              <div className="list-header">
                                <h3>{list === "listA" ? "🗒️ List A" : "📘 List B"}</h3>
                                <button className="delete-list-btn" onClick={() => deleteList(topicKey, list)}> 🗑️ Delete List </button>
                              </div>

                              <DragDropContext onDragEnd={(result) => handleTaskDragEnd(result, topicKey, list)} >
                                <Droppable droppableId={`${topicKey}-${list}`}>
                                  {(provided) => (
                                    <ul className="todo-list" {...provided.droppableProps} ref={provided.innerRef}   >
                                      {todos[topicKey]?.[list]?.map((todo, index) => (
                                        <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                          {(provided) => (
                                            <li ref={provided.innerRef}  {...provided.draggableProps}
                                              {...provided.dragHandleProps} className={todo.completed ? "completed" : ""} >
                                              {editId === todo.id ? (
                                                <>
                                                  <input className="edit-input"   value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}/>
                                                  <input className="edit-input"
                                                    value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                                                  <div className="list-inp">
                                                    <button onClick={() => saveEdit(topicKey, list, todo.id)}>💾</button>
                                                    <button onClick={cancelEdit}>✖</button>
                                                  </div>
                                                </>
                                              ) : (
                                                <>
                                                  <div className="todo-header">
                                                    <input type="checkbox"   checked={todo.completed}
                                                      onChange={() => toggleComplete(topicKey, list, todo.id)}/>
                                                    <span
                                                      className="todo-title" onClick={() => toggleExpand(todo.id)}>{todo.title} </span>
                                                  </div>

                                                  {expandedId === todo.id && todo.description && (
                                                    <div className="todo-description">{todo.description}</div>
                                                  )}

                                                  <div className="actions">
                                                    <button onClick={() => startEditing(todo)}>✏️</button>
                                                    <button onClick={() => deleteTask(topicKey, list, todo.id)}>❌</button>
                                                  </div>
                                                </>
                                              )}
                                            </li>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </ul>
                                  )}
                                </Droppable>
                              </DragDropContext>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default App;
