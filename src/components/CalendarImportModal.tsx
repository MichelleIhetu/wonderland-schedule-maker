import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Calendar, FileText, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  isAllDay?: boolean;
}

interface CalendarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (events: CalendarEvent[]) => void;
}

const CalendarImportModal = ({ isOpen, onClose, onImport }: CalendarImportModalProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedEvents, setParsedEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const parseICSFile = async (file: File): Promise<CalendarEvent[]> => {
    const text = await file.text();
    const events: CalendarEvent[] = [];
    
    // Simple ICS parser for VEVENT components
    const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
    let match;
    
    while ((match = veventRegex.exec(text)) !== null) {
      const eventData = match[1];
      
      const getField = (field: string): string => {
        const regex = new RegExp(`${field}[^:]*:(.+?)(?:\\r?\\n|$)`, 'i');
        const fieldMatch = eventData.match(regex);
        return fieldMatch ? fieldMatch[1].trim() : '';
      };
      
      const parseICSDate = (dateStr: string): string => {
        if (!dateStr) return '';
        // Handle formats: 20240115T090000Z or 20240115T090000 or 20240115
        const cleaned = dateStr.replace(/[^0-9T]/g, '');
        if (cleaned.length >= 8) {
          const year = cleaned.slice(0, 4);
          const month = cleaned.slice(4, 6);
          const day = cleaned.slice(6, 8);
          const hour = cleaned.length >= 11 ? cleaned.slice(9, 11) : '00';
          const minute = cleaned.length >= 13 ? cleaned.slice(11, 13) : '00';
          return `${hour}:${minute}`;
        }
        return '';
      };
      
      const summary = getField('SUMMARY');
      const dtstart = getField('DTSTART');
      const dtend = getField('DTEND');
      const description = getField('DESCRIPTION');
      const uid = getField('UID') || `event-${Date.now()}-${Math.random()}`;
      
      if (summary && dtstart) {
        events.push({
          id: uid,
          title: summary.replace(/\\,/g, ',').replace(/\\n/g, ' '),
          startTime: parseICSDate(dtstart),
          endTime: parseICSDate(dtend) || parseICSDate(dtstart),
          description: description?.replace(/\\n/g, '\n').replace(/\\,/g, ','),
          isAllDay: dtstart.length === 8,
        });
      }
    }
    
    // Sort by start time
    events.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    return events;
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.ics') && !file.name.endsWith('.ical')) {
      setError('Please upload an ICS or iCal file');
      return;
    }
    
    setIsProcessing(true);
    try {
      const events = await parseICSFile(file);
      if (events.length === 0) {
        setError('No events found in the calendar file');
      } else {
        setParsedEvents(events);
        setSelectedEvents(new Set(events.map(e => e.id)));
      }
    } catch (err) {
      setError('Failed to parse calendar file');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setIsProcessing(true);
    
    try {
      const events = await parseICSFile(file);
      if (events.length === 0) {
        setError('No events found in the calendar file');
      } else {
        setParsedEvents(events);
        setSelectedEvents(new Set(events.map(e => e.id)));
      }
    } catch (err) {
      setError('Failed to parse calendar file');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleEvent = (id: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEvents(newSelected);
  };

  const handleImport = () => {
    const eventsToImport = parsedEvents.filter(e => selectedEvents.has(e.id));
    onImport(eventsToImport);
    onClose();
    setParsedEvents([]);
    setSelectedEvents(new Set());
  };

  const resetState = () => {
    setParsedEvents([]);
    setSelectedEvents(new Set());
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Import Calendar
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="w-full bg-muted/30">
            <TabsTrigger value="file" className="flex-1 gap-2">
              <FileText className="w-4 h-4" />
              ICS File
            </TabsTrigger>
            <TabsTrigger value="google" className="flex-1 gap-2">
              <Calendar className="w-4 h-4" />
              Google
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-4">
            {parsedEvents.length === 0 ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging 
                    ? "border-primary bg-primary/10" 
                    : "border-primary/30 hover:border-primary/50"
                }`}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-muted-foreground">Processing calendar...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-primary/60" />
                    <p className="text-foreground font-body mb-2">
                      Drag & drop your calendar file
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports ICS files from Google Calendar, Apple Calendar, Outlook, PowerPlanner, and more
                    </p>
                    <label>
                      <input
                        type="file"
                        accept=".ics,.ical"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </>
                )}
                
                {error && (
                  <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {parsedEvents.length} events
                  </p>
                  <Button variant="ghost" size="sm" onClick={resetState}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                  {parsedEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedEvents.has(event.id)
                          ? "border-primary bg-primary/10"
                          : "border-primary/20 bg-card/50 opacity-50"
                      }`}
                      onClick={() => toggleEvent(event.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedEvents.has(event.id)
                            ? "border-primary bg-primary"
                            : "border-primary/30"
                        }`}>
                          {selectedEvents.has(event.id) && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.isAllDay ? "All day" : `${event.startTime} - ${event.endTime}`}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <Button
                  onClick={handleImport}
                  disabled={selectedEvents.size === 0}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Import {selectedEvents.size} Event{selectedEvents.size !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-muted/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>How to export:</strong> In most calendar apps, go to Settings → Export or Share → Download as ICS
              </p>
            </div>
          </TabsContent>

          <TabsContent value="google" className="mt-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-muted/30 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg text-foreground mb-2">
                Google Calendar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Google account to import events directly
              </p>
              <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
                To enable Google Calendar sync, you'll need to configure Google OAuth in your backend settings. For now, you can export your Google Calendar as an ICS file and import it using the "ICS File" tab.
              </p>
              
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs text-foreground">
                  <strong>Quick tip:</strong> In Google Calendar, click the ⚙️ Settings → Import & Export → Export to download your calendar as an ICS file
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarImportModal;
