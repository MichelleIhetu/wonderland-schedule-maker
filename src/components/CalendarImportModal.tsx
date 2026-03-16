import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Calendar, FileText, X, Check, AlertCircle, Loader2, ExternalLink } from "lucide-react";

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

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
  
  // Google auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [selectedGoogleEvents, setSelectedGoogleEvents] = useState<Set<string>>(new Set());
  const [hasFetchedGoogle, setHasFetchedGoogle] = useState(false);

  useEffect(() => {
    // Set up auth state listener — capture provider_token if available
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.provider_token) {
          setProviderToken(session.provider_token);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.provider_token) {
        setProviderToken(session.provider_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-fetch Google events when modal opens and provider token is available
  useEffect(() => {
    if (isOpen && providerToken && session && !hasFetchedGoogle && googleEvents.length === 0) {
      fetchGoogleCalendarEvents();
    }
  }, [isOpen, providerToken, session]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    
    try {
      // Use direct OAuth (not managed OIDC) so we get provider_token for Calendar API
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.readonly',
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });
      
      if (error) {
        console.error('Google sign in error:', error);
        setError(error.message);
        setIsGoogleLoading(false);
        return;
      }

      if (data?.url) {
        const popup = window.open(data.url, 'google-oauth', 'width=500,height=650,left=100,top=100');
        
        if (!popup) {
          setError('Popup was blocked. Please allow popups for this site and try again.');
          setIsGoogleLoading(false);
          return;
        }

        // Poll until popup closes, then capture session + provider_token
        const pollInterval = setInterval(async () => {
          if (popup.closed) {
            clearInterval(pollInterval);
            const { data: { session: newSession } } = await supabase.auth.getSession();
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
              if (newSession.provider_token) {
                setProviderToken(newSession.provider_token);
              } else {
                setError('Calendar access not granted. Please try signing in again.');
              }
            } else {
              setError('Sign-in was not completed. Please try again.');
            }
            setIsGoogleLoading(false);
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError('Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await supabase.auth.signOut();
    setGoogleEvents([]);
    setSelectedGoogleEvents(new Set());
    setProviderToken(null);
  };


  const fetchGoogleCalendarEvents = async () => {
    if (!session) {
      setError('Please sign in with Google first');
      return;
    }

    // If no provider token, we need to re-auth to get calendar access
    if (!providerToken) {
      setHasFetchedGoogle(false);
      setError(null);
      handleGoogleSignIn();
      return;
    }

    setIsGoogleLoading(true);
    setError(null);

    try {
      const localStart = new Date();
      localStart.setHours(0, 0, 0, 0);
      const localEnd = new Date(localStart);
      localEnd.setDate(localEnd.getDate() + 1);

      const { data, error } = await supabase.functions.invoke('google-calendar', {
        headers: {
          'x-provider-token': providerToken,
        },
        body: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timeMin: localStart.toISOString(),
          timeMax: localEnd.toISOString(),
        },
      });

      if (error) {
        console.error('Error fetching calendar:', error);
        setError('Failed to fetch calendar events');
        return;
      }

      if (data.error) {
        console.error('Calendar API error:', data.error);
        setError(data.error);
        return;
      }

      const events = data.events || [];
      setGoogleEvents(events);
      setSelectedGoogleEvents(new Set(events.map((e: CalendarEvent) => e.id)));
      setHasFetchedGoogle(true);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch calendar events');
      setHasFetchedGoogle(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };



  const toggleGoogleEvent = (id: string) => {
    const newSelected = new Set(selectedGoogleEvents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGoogleEvents(newSelected);
  };

  const handleGoogleImport = () => {
    const eventsToImport = googleEvents.filter(e => selectedGoogleEvents.has(e.id));
    onImport(eventsToImport);
    onClose();
  };

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
            {!user || (!providerToken && !user?.app_metadata?.provider?.includes('google')) ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-muted/30 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">
                  Google Calendar
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {user ? "Grant calendar access to import today's events" : "Connect your Google account to import today's events"}
                </p>

                {isInIframe() ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-foreground">
                      Google sign-in requires opening the app outside the preview. Click below to open in a new tab.
                    </div>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in New Tab to Sign In
                    </a>
                  </div>
                ) : (
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 gap-2"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    {user ? "Grant Calendar Access" : "Sign in with Google"}
                  </Button>
                )}

                {error && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Works with Google Calendar, and any calendar synced to Google (PowerPlanner, etc.)
                  </p>
                </div>
              </div>
            ) : isGoogleLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Fetching today's events...</p>
              </div>
            ) : hasFetchedGoogle && googleEvents.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-muted/30 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">
                  No events today
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your Google Calendar has no events for today.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => { setHasFetchedGoogle(false); fetchGoogleCalendarEvents(); }}
                    variant="outline"
                    className="gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Refresh
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleGoogleSignOut}
                    className="text-muted-foreground"
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            ) : googleEvents.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">
                  Connected as {user.email}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Fetch your events for today
                </p>
                
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={fetchGoogleCalendarEvents}
                    disabled={isGoogleLoading}
                    className="w-full bg-primary hover:bg-primary/90 gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Fetch Today's Events
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={handleGoogleSignOut}
                    className="text-muted-foreground"
                  >
                    Sign out
                  </Button>
                </div>

                {error && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {googleEvents.length} events for today
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setGoogleEvents([])}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                  {googleEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedGoogleEvents.has(event.id)
                          ? "border-primary bg-primary/10"
                          : "border-primary/20 bg-card/50 opacity-50"
                      }`}
                      onClick={() => toggleGoogleEvent(event.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedGoogleEvents.has(event.id)
                            ? "border-primary bg-primary"
                            : "border-primary/30"
                        }`}>
                          {selectedGoogleEvents.has(event.id) && (
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
                  onClick={handleGoogleImport}
                  disabled={selectedGoogleEvents.size === 0}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Import {selectedGoogleEvents.size} Event{selectedGoogleEvents.size !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarImportModal;
