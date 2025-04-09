import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { ServiceCategoryEnum } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, Search, DollarSign, Scale } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const QuickUpload = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serviceType, setServiceType] = useState<string>("forensic");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", "/api/documents/upload", formData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded and is being analyzed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, XLSX, JPEG, or PNG file.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 25MB.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !user) return;
    
    // Create a new FormData instance
    const formData = new FormData();
    
    // Append the file with the correct field name matching the server's multer config
    formData.append('file', selectedFile);
    
    // Ensure category value is one of the acceptable enum values
    if (!['forensic', 'tax', 'legal'].includes(serviceType)) {
      toast({
        title: "Invalid service type",
        description: "Please select a valid service type: forensic, tax, or legal",
        variant: "destructive",
      });
      return;
    }
    
    // Add category with the same name expected by the server
    formData.append('category', serviceType);
    
    // Log what we're sending to help with debugging
    console.log('Uploading document', {
      filename: selectedFile.name,
      filesize: selectedFile.size,
      filetype: selectedFile.type,
      category: serviceType
    });
    
    // Execute the upload mutation
    uploadMutation.mutate(formData);
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Quick Upload</h3>
      </div>
      <div className="p-6">
        <div 
          className={cn(
            "bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-100 transition",
            dragging && "border-primary bg-primary-50",
            selectedFile && "border-green-300 bg-green-50"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            onChange={handleFileChange}
            accept=".pdf,.docx,.xlsx,.jpeg,.jpg,.png"
          />
          <div className="space-y-2">
            {selectedFile ? (
              <>
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <UploadCloud className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500">
                  Drag and drop a document here, or <span className="text-primary font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-400">PDF, DOCX, XLSX, JPEG up to 25MB</p>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Select service type:</span>
          </div>
          <RadioGroup 
            value={serviceType} 
            onValueChange={setServiceType}
            className="grid grid-cols-3 gap-2"
          >
            <div className="relative">
              <RadioGroupItem 
                value="forensic" 
                id="forensic" 
                className="sr-only peer" 
              />
              <Label 
                htmlFor="forensic" 
                className="flex flex-col items-center p-2 bg-white border rounded-md cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary-50 hover:bg-gray-50"
              >
                <Search className="h-5 w-5 text-gray-500 peer-data-[state=checked]:text-primary" />
                <span className="mt-1 text-xs text-center">Forensic</span>
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem 
                value="tax" 
                id="tax" 
                className="sr-only peer" 
              />
              <Label 
                htmlFor="tax" 
                className="flex flex-col items-center p-2 bg-white border rounded-md cursor-pointer peer-data-[state=checked]:border-[hsl(179,48%,32%)] peer-data-[state=checked]:bg-[hsla(179,48%,32%,0.1)] hover:bg-gray-50"
              >
                <DollarSign className="h-5 w-5 text-gray-500 peer-data-[state=checked]:text-[hsl(179,48%,32%)]" />
                <span className="mt-1 text-xs text-center">Tax</span>
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem 
                value="legal" 
                id="legal" 
                className="sr-only peer" 
              />
              <Label 
                htmlFor="legal" 
                className="flex flex-col items-center p-2 bg-white border rounded-md cursor-pointer peer-data-[state=checked]:border-[#f59e0b] peer-data-[state=checked]:bg-[rgba(245,158,11,0.1)] hover:bg-gray-50"
              >
                <Scale className="h-5 w-5 text-gray-500 peer-data-[state=checked]:text-[#f59e0b]" />
                <span className="mt-1 text-xs text-center">Legal</span>
              </Label>
            </div>
          </RadioGroup>
          
          <Button 
            className="mt-4 w-full"
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Upload & Analyze</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickUpload;
